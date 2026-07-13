/**
 * Build the application's schema-defined indexes on DocumentDB.
 *
 * WHY: prod connects with autoIndex:false (src/services/mongo.service.ts), and the
 * DocDB migration copied documents but NOT indexes — every collection on the cluster
 * has only the default _id_ index, so every {team}-scoped mobile query COLLSCANs.
 * This registers all Mongoose models (by requiring every *.model.ts) and builds their
 * indexes on the connected cluster.
 *
 * SAFE BY DEFAULT: uses createIndexes() (create-only) — it never drops. Set
 * SYNC_DROP=1 to use syncIndexes() instead (also prunes indexes not in the schema);
 * only do that once you've confirmed no collection has a hand-made index worth keeping.
 *
 * Read/write to indexes only (no document writes). Requires DOCDB_TEST_URI + the tunnel.
 * Run:
 *   DOCDB_TEST_URI="mongodb://...localhost:27018/osaAndes?tls=true&tlsCAFile=./global-bundle.pem&tlsAllowInvalidHostnames=true&directConnection=true&retryWrites=false&authSource=admin" \
 *   NODE_OPTIONS="--no-experimental-strip-types" TS_NODE_TRANSPILE_ONLY=1 \
 *   npx ts-node -P tsconfig.json scripts/docdb-build-indexes.ts
 */
/* eslint-disable @typescript-eslint/no-var-requires */
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Dummy creds so import-time plugins (mongoose-crate-s3) don't throw at schema-definition
// time (the File models read AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY/S3_BUCKET). No AWS calls
// happen in this script — the DocDB connection uses DOCDB_TEST_URI, not the AWS SDK.
for (const [k, v] of Object.entries({
  AWS_ACCESS_KEY_ID: 'AKIAX0000000000STUB0',
  AWS_SECRET_ACCESS_KEY: 'x0000000000000000000000000000000000000x',
  S3_BUCKET: 'docdb-index-build-stub',
  S3_REGION: 'us-east-1',
  S3_KEY: 'AKIAX0000000000STUB0',
  S3_SECRET: 'x0000000000000000000000000000000000000x'
})) {
  if (!process.env[k]) process.env[k] = v as string;
}

// Several model files transitively load native addons (bcrypt, mmmagic) whose prebuilt
// .node binaries are arch-mismatched in this environment (Node 22 / arm64 → "not a valid
// mach-o file"). We only need the schemas to build indexes — not these modules' runtime
// behavior — so stub them at require() time so ALL model files import and register.
const Module = require('module');
const _origLoad = Module._load;
const NATIVE_STUBS: Record<string, any> = {
  bcrypt: {
    hash: async () => '$stub$',
    compare: async () => false,
    genSalt: async () => '$stub$',
    hashSync: () => '$stub$',
    compareSync: () => false,
    genSaltSync: () => '$stub$'
  },
  mmmagic: (() => {
    class Magic {
      constructor(_a?: any, _b?: any) {}
      detect(_buf: any, cb: any) {
        if (cb) cb(null, 'application/octet-stream');
      }
      detectFile(_p: any, cb: any) {
        if (cb) cb(null, 'application/octet-stream');
      }
    }
    return { Magic, MAGIC_MIME_TYPE: 0x000010, MAGIC_MIME_ENCODING: 0x000400, MAGIC_MIME: 0x000410 };
  })()
};
Module._load = function (request: string, ...rest: any[]) {
  if (Object.prototype.hasOwnProperty.call(NATIVE_STUBS, request)) return NATIVE_STUBS[request];
  return _origLoad.call(this, request, ...rest);
};

const URI: string | undefined = process.env.DOCDB_TEST_URI;
if (!URI) {
  console.error('Set DOCDB_TEST_URI (see DOCDB-MIGRATION.md for the tunnel).');
  process.exit(1);
}
const DROP = process.env.SYNC_DROP === '1'; // default: create-only

function collectModelFiles(dir: string, acc: string[] = []): string[] {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === 'dist' || e.name.startsWith('.')) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) collectModelFiles(full, acc);
    else if (e.name.endsWith('.model.ts')) acc.push(full);
  }
  return acc;
}

async function main(): Promise<void> {
  console.log(`Connecting to DocDB (${DROP ? 'syncIndexes / WILL PRUNE' : 'createIndexes / create-only'})…`);
  await mongoose.connect(URI, { autoIndex: false, serverSelectionTimeoutMS: 20000 });
  console.log(`Connected: db=${mongoose.connection.name}\n`);

  // Register every model by requiring its file. Isolate failures so one bad import
  // (e.g. a file-attachment model missing real S3 config) can't abort the whole build.
  const files = collectModelFiles(path.resolve('src'));
  const importFails: Array<[string, string]> = [];
  for (const f of files) {
    try {
      require(f);
    } catch (e: any) {
      importFails.push([path.relative(process.cwd(), f), String(e && e.message).split('\n')[0]]);
    }
  }

  const names: string[] = mongoose.modelNames().sort();
  console.log(
    `Registered ${names.length} models from ${files.length} model files` +
      (importFails.length ? `  (${importFails.length} import failures — see bottom)` : '') +
      '\n'
  );

  let totalCreated = 0;
  let totalErr = 0;
  const lines: string[] = [];
  for (const name of names) {
    const model = mongoose.model(name);
    const coll = model.collection.collectionName;
    let beforeNames = new Set<string>();
    try {
      const before = await model.collection.indexes();
      beforeNames = new Set(before.map((i: any) => i.name));
    } catch {
      /* collection may not exist yet */
    }
    try {
      if (DROP) await model.syncIndexes();
      else await model.createIndexes();
      const after = await model.collection.indexes();
      const created = after.filter((i: any) => !beforeNames.has(i.name)).map((i: any) => i.name);
      totalCreated += created.length;
      lines.push(
        created.length
          ? `  ✅ ${coll.padEnd(22)} +${created.length}  (${created.join(', ')})`
          : `  •  ${coll.padEnd(22)} no new  (${after.length} total)`
      );
    } catch (e: any) {
      totalErr++;
      lines.push(`  ❌ ${coll.padEnd(22)} ERROR: ${String(e && e.message).split('\n')[0]}`);
    }
  }

  console.log(lines.join('\n'));
  console.log(`\n── ${totalCreated} indexes created across ${names.length} models, ${totalErr} model errors ──`);
  if (importFails.length) {
    console.log('\nModel files that failed to import (indexes NOT built for these):');
    for (const [f, m] of importFails) console.log(`  - ${f}\n      ${m}`);
  }

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
