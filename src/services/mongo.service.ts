import * as fs from 'fs';
import * as mongoose from 'mongoose';
import logger from './logger.service';

export interface MongoConnectOptions extends mongoose.ConnectOptions {}

/**
 * Return MONGODB_URI augmented with TLS query parameters when
 * MONGO_TLS_CA_FILE is set. Use this for code paths that take a connection
 * string but no options object (e.g. mongo-migrate-ts).
 */
export function buildMongoUri(): string {
  const uri = process.env.MONGODB_URI || '';
  const caFile = process.env.MONGO_TLS_CA_FILE;
  if (!uri || !caFile) {
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
  if (caFile) {
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
  }

  await mongoose.connect(uri, opts);
  logger.info('mongoose: connected');
  return mongoose;
}
