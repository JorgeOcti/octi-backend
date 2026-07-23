import * as fs from 'fs';
import * as mongoose from 'mongoose';
import logger from './logger.service';

export interface MongoConnectOptions extends mongoose.ConnectOptions {}

/**
 * Heuristic — true when the URI points at MongoDB Atlas (SRV scheme or
 * mongodb.net host). Atlas uses public CAs and supports retryWrites; the
 * DocDB-specific TLS settings are wrong for it.
 */
function isAtlasUri(uri: string): boolean {
  return uri.startsWith('mongodb+srv://') || uri.includes('mongodb.net');
}

/**
 * Return MONGODB_URI augmented with TLS query parameters when
 * MONGO_TLS_CA_FILE is set AND the URI is not Atlas. Use this for code paths
 * that take a connection string but no options object (e.g. mongo-migrate-ts).
 */
export function buildMongoUri(): string {
  const uri = process.env.MONGODB_URI || '';
  const caFile = process.env.MONGO_TLS_CA_FILE;
  if (!uri || !caFile || isAtlasUri(uri)) {
    return uri;
  }
  const sep = uri.includes('?') ? '&' : '?';
  const params = `tls=true&tlsCAFile=${encodeURIComponent(
    caFile
  )}&retryWrites=false`;
  return `${uri}${sep}${params}`;
}

/**
 * DocumentDB does NOT implement the `allowDiskUse` option — for aggregations OR
 * find/paginate queries. It rejects the field outright with
 * "Field 'allowDiskUse' is currently not supported". MongoDB/Atlas silently
 * accept it, so many call sites across the codebase (and mongoose-paginate-v2,
 * which calls `query.allowDiskUse()`) set it. Rather than hunt down every site,
 * neutralize it centrally at the driver layer:
 *   1. wrap `exec` on Query + Aggregate to strip `options.allowDiskUse` before
 *      it reaches the server (catches the options-object / paginate path), and
 *   2. make the fluent `.allowDiskUse()` setter a no-op (catches chained calls).
 *
 * Applied ONLY for DocDB (not Atlas), so Atlas deployments keep their disk-spill
 * behavior. Prototype-level and idempotent, so it applies regardless of when
 * models were compiled. Aggregations that genuinely needed disk will now surface
 * a "low available memory" error instead — fix those with indexes / pipeline
 * shape (see DOCDB-MIGRATION.md), not by re-enabling allowDiskUse.
 */
function disableAllowDiskUseForDocDB(): void {
  const patch = (proto: any, label: string): void => {
    if (!proto || proto.__docdbNoAllowDiskUse) return;
    const origExec = proto.exec;
    proto.exec = function (...args: any[]) {
      if (this.options && this.options.allowDiskUse !== undefined) {
        delete this.options.allowDiskUse;
      }
      return origExec.apply(this, args);
    };
    // No-op the fluent setter so nothing (incl. mongoose-paginate-v2) re-adds it.
    proto.allowDiskUse = function () {
      return this;
    };
    proto.__docdbNoAllowDiskUse = true;
    logger.info(`allowDiskUse: stripped for DocDB (${label})`);
  };
  patch((mongoose as any).Query && (mongoose as any).Query.prototype, 'Query');
  patch(
    (mongoose as any).Aggregate && (mongoose as any).Aggregate.prototype,
    'Aggregate'
  );
}

/**
 * Connect mongoose to MongoDB / DocumentDB using env-driven config.
 *
 * Reads:
 *   MONGODB_URI         — required.
 *   MONGO_TLS_CA_FILE   — optional. Path to a CA bundle. When set, TLS is
 *                         enabled and this file is passed as `tlsCAFile`.
 *                         For AWS DocumentDB, point at the global RDS bundle
 *                         (the repo ships `global-bundle.pem`).
 */
export async function connectMongo(
  extra: MongoConnectOptions = {}
): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI || '';
  if (!uri) {
    throw new Error('MONGODB_URI is not set');
  }

  // DocDB (non-Atlas) rejects `allowDiskUse`; strip it at the driver layer.
  if (!isAtlasUri(uri)) {
    disableAllowDiskUseForDocDB();
  }

  const opts: MongoConnectOptions = { autoIndex: false, ...extra };

  const caFile = process.env.MONGO_TLS_CA_FILE;
  // Apply DocDB-specific TLS settings only when (a) the CA bundle is
  // configured AND (b) the URI is NOT Atlas. The Dockerfile sets
  // MONGO_TLS_CA_FILE=/srv/global-bundle.pem by default; passing that as
  // tlsCAFile to an Atlas connection would force the AWS RDS CA store and
  // fail verification against Atlas's public-CA certs.
  if (caFile && !isAtlasUri(uri)) {
    if (!fs.existsSync(caFile)) {
      throw new Error(
        `MONGO_TLS_CA_FILE is set to "${caFile}" but the file does not exist`
      );
    }
    // DocumentDB requires TLS + the AWS RDS root CA bundle. retryWrites is
    // unsupported by DocumentDB and must be off.
    opts.tls = true;
    opts.tlsCAFile = caFile;
    opts.retryWrites = false;
    // For local end-to-end testing through an SSM tunnel (localhost:27018) the
    // DocDB cert won't match "localhost"; opt in via env. NEVER set in prod.
    if (process.env.MONGO_TLS_ALLOW_INVALID_HOSTNAMES === 'true') {
      (opts as any).tlsAllowInvalidHostnames = true;
    }
  }

  await mongoose.connect(uri, opts);
  logger.info('mongoose: connected');
  return mongoose;
}

/**
 * Create any schema-defined indexes that don't yet exist on the connected
 * cluster, for every registered model.
 *
 * Why this exists: we connect with `autoIndex: false` (so Mongoose does NOT
 * build indexes automatically on boot), and AWS DocumentDB migrations copy
 * documents but NOT indexes — so a freshly migrated cluster has only `_id_` on
 * every collection and every team-scoped query collection-scans. This closes
 * that gap by ensuring the app's indexes exist whenever it starts.
 *
 * Safe to run on every boot: `createIndexes()` is create-only and idempotent —
 * on a cluster that already has the indexes it is a cheap no-op (it never drops
 * anything, unlike syncIndexes). Per-model failures (e.g. a unique index blocked
 * by duplicate data, such as `codes.correlative`) are logged and skipped, never
 * fatal. It does not block the HTTP server from accepting traffic (server.ts
 * calls app.listen independently of the bootstrap promise).
 *
 * Skipped when ENSURE_INDEXES=false, or in the testing env.
 */
export async function ensureIndexes(): Promise<void> {
  if (process.env.ENSURE_INDEXES === 'false' || process.env.ENV === 'testing') {
    logger.info('ensureIndexes: skipped (disabled or testing env)');
    return;
  }
  const names = mongoose.modelNames();
  let ok = 0;
  let failed = 0;
  for (const name of names) {
    try {
      await mongoose.model(name).createIndexes();
      ok++;
    } catch (err: any) {
      failed++;
      logger.error(`ensureIndexes: "${name}" — ${err && err.message}`);
    }
  }
  logger.info(
    `ensureIndexes: ensured ${ok}/${names.length} models` +
      (failed ? `, ${failed} failed (logged above)` : '')
  );
}
