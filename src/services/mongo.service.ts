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
  const params = `tls=true&tlsCAFile=${encodeURIComponent(caFile)}&retryWrites=false`;
  return `${uri}${sep}${params}`;
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
