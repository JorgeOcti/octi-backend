#!/usr/bin/env node
'use strict';

/**
 * DocDB index/scan diagnostic — disambiguates the COLLSCAN result from the
 * /api/v1 compat suite. A COLLSCAN can mean "empty dev collection" (benign) OR
 * "index missing on the cluster" (serious). This reports, per collection:
 *   - estimatedDocumentCount
 *   - the indexes that ACTUALLY exist on the DocDB cluster
 *   - whether a PLAIN {team} equality (no regex) uses an index (the control)
 *   - whether a case-SENSITIVE anchored regex uses an index (the fixable form)
 *
 * Read-only. Requires DOCDB_TEST_URI + the bastion tunnel. Usage:
 *   DOCDB_TEST_URI="..." node scripts/docdb-index-diagnostic.js
 */
const { MongoClient } = require('mongodb');

const URI = process.env.DOCDB_TEST_URI;
if (!URI) {
  console.error('Set DOCDB_TEST_URI (see DOCDB-MIGRATION.md for the tunnel).');
  process.exit(1);
}

const COLLECTIONS = ['cars', 'requestitems', 'transmittals'];

/** Walk a DocDB explain tree -> {access, chain, idx}. */
function accessOf(explain) {
  const chain = [];
  const idx = [];
  const walk = (n) => {
    if (!n || typeof n !== 'object') return;
    if (Array.isArray(n)) return n.forEach(walk);
    if (typeof n.stage === 'string') {
      chain.push(n.stage);
      if (n.indexName) idx.push(n.indexName);
    }
    for (const k of ['inputStage', 'inputStages', 'queryPlanner', 'winningPlan', 'executionStages', 'executionStats', '$cursor', 'stages']) {
      if (n[k]) walk(n[k]);
    }
  };
  walk(explain);
  const access = chain.includes('COLLSCAN')
    ? 'COLLSCAN'
    : idx.length
      ? `IXSCAN(${[...new Set(idx)].join(',')})`
      : chain.includes('IXSCAN')
        ? 'IXSCAN'
        : '?';
  return { access, chain: chain.join('>'), idx: [...new Set(idx)] };
}

async function explainFind(db, coll, filter) {
  const ex = await db.command({ explain: { find: coll, filter, limit: 5 }, verbosity: 'executionStats' });
  return accessOf(ex);
}

(async () => {
  const client = new MongoClient(URI);
  await client.connect();
  const db = client.db();
  console.log(`\nDocDB index diagnostic — db=${db.databaseName}\n`);

  for (const coll of COLLECTIONS) {
    console.log(`===== ${coll} =====`);
    try {
      const count = await db.collection(coll).estimatedDocumentCount();
      console.log(`  estimatedDocumentCount: ${count}`);

      const ix = await db.collection(coll).indexes();
      console.log(`  indexes (${ix.length}):`);
      for (const i of ix) {
        const flags = [i.partialFilterExpression ? 'PARTIAL' : '', i.sparse ? 'SPARSE' : '', i.unique ? 'UNIQUE' : '']
          .filter(Boolean)
          .join(' ');
        console.log(`     - ${i.name}  ${JSON.stringify(i.key)}  ${flags}`);
      }

      // Find a real team id that actually has documents, to make the control meaningful.
      const sample = await db.collection(coll).findOne({ team: { $exists: true } }, { projection: { team: 1 } });
      const team = sample && sample.team;
      console.log(`  sample team with docs: ${team ? String(team) : 'NONE (collection has no team-bearing docs)'}`);

      if (team) {
        const teamCount = await db.collection(coll).countDocuments({ team });
        console.log(`  docs for that team: ${teamCount}`);
        // CONTROL 1: plain equality on team — this is the litmus test for "does the index work at all".
        console.log(`  explain {team} (plain eq)         -> ${JSON.stringify(await explainFind(db, coll, { team }))}`);
        // CONTROL 2: anchored, case-SENSITIVE regex on an indexed-ish field (the DocDB-friendly form).
        console.log(`  explain {team, patent:/^A/}        -> ${JSON.stringify(await explainFind(db, coll, { team, patent: { $regex: '^A' } }))}`);
        // CONTROL 3: the actual mobile shape — case-insensitive unanchored regex.
        console.log(`  explain {team, patent:/A/i}        -> ${JSON.stringify(await explainFind(db, coll, { team, patent: { $regex: 'A', $options: 'i' } }))}`);
      }
    } catch (e) {
      console.log(`  ERROR: ${e && e.message}`);
    }
    console.log('');
  }

  await client.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
