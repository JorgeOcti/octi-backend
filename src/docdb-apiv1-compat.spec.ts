/**
 * DocumentDB 5.0 — /api/v1 (mobile) query-shape contract tests.
 *
 * The static sweep of all 99 /api/v1 mobile endpoints found NO hard-fail shapes
 * (no pipeline/let $lookup, $facet, $graphLookup, server-side JS, $text, geo,
 * arrayFilters, or incompatible index definitions reachable from a mobile route).
 * The only DocDB concern is a single class: case-insensitive / unanchored $regex
 * that RUNS on DocDB 5.0 but cannot use a btree index. Every occurrence is also
 * `team`-scoped, so the residual regex filter runs over one team's subset rather
 * than the whole collection.
 *
 * This suite runs the ACTUAL query shapes those endpoints build against a REAL
 * DocumentDB 5.0 cluster and asserts two things:
 *   1. FUNCTIONAL  — DocDB accepts and executes each shape without error
 *                    (this is the "will any mobile query break?" answer).
 *   2. PLAN VISIBILITY — dumps executionStats (stage / docsExamined / nReturned)
 *                    so the regex-scan cost is observable, not assumed.
 *
 * Skipped unless DOCDB_TEST_URI points at a reachable DocDB. Bring up the bastion
 * tunnel (see DOCDB-MIGRATION.md), then:
 *
 *   DOCDB_TEST_URI="mongodb://osacontrol:<pwd>@localhost:27018/osaAndes?\
 *     tls=true&tlsCAFile=./global-bundle.pem&tlsAllowInvalidHostnames=true&\
 *     directConnection=true&retryWrites=false&authSource=admin" \
 *   npm test -- --grep "DocDB /api/v1"
 *
 * NOTE: read-only. The update-massive endpoint's shape is exercised as its
 * equivalent FIND (the updateMany match phase) so the suite never mutates data.
 */
import { MongoClient, Db, ObjectId } from 'mongodb';
import * as chai from 'chai';

const expect = chai.expect;

const URI = process.env.DOCDB_TEST_URI;
const suite = URI ? describe : describe.skip;

// A harmless team id — empty results are fine; we assert acceptance + inspect the plan.
const TEAM = new ObjectId('000000000000000000000000');
const VENUE = new ObjectId('000000000000000000000001');
const DRIVER = new ObjectId('000000000000000000000002');

/** Each shape mirrors a confirmed finding, tagged with its source endpoint + file:line. */
interface Shape {
  id: string;
  endpoint: string;
  where: string;
  collection: string;
  kind: 'find' | 'aggregate';
  query: any; // find filter OR aggregate pipeline
}

const SHAPES: Shape[] = [
  // --- request module ------------------------------------------------------
  {
    id: 'search-car',
    endpoint: 'GET /api/v1/requests/search-car/',
    where: 'request.controller.ts:2131',
    collection: 'cars',
    kind: 'aggregate',
    query: [
      { $match: { team: TEAM } },
      {
        $match: {
          $or: [
            { vin: { $regex: 'AB', $options: 'i' } },
            { vin2: { $regex: 'AB', $options: 'i' } },
            { patent: { $regex: 'AB', $options: 'i' } },
            { brand: { $regex: 'AB', $options: 'i' } },
            { denomination: { $regex: 'AB', $options: 'i' } },
            { color: { $regex: 'AB', $options: 'i' } }
          ]
        }
      },
      { $limit: 5 }
    ]
  },
  {
    id: 'update-massive (match phase, read-only)',
    endpoint: 'POST /api/v1/requests/update-massive/',
    where: 'request.controller.ts:396',
    collection: 'cars',
    kind: 'find',
    query: {
      team: TEAM,
      $or: [
        { brand: { $regex: new RegExp('toyota', 'i') } },
        { brand: { $regex: new RegExp('nissan', 'i') } }
      ]
    }
  },
  {
    id: 'requests-item (text + entry + sellerText regex)',
    endpoint: 'POST /api/v1/requests-item/',
    where: 'request.controller.ts:880-905',
    collection: 'requestitems',
    kind: 'aggregate',
    query: [
      { $match: { team: TEAM, $or: [{ destination: { $in: [VENUE] } }, { origin: { $in: [VENUE] } }] } },
      {
        $match: {
          'meta.car.entry': { $regex: 'AB', $options: 'i' },
          $or: [
            { 'meta.car.vin': { $regex: 'ab', $options: 'i' } },
            { 'meta.car.brand': { $regex: 'ab', $options: 'i' } },
            { 'meta.car.color': { $regex: 'ab', $options: 'i' } },
            { 'meta.car.denomination': { $regex: 'ab', $options: 'i' } },
            { 'meta.car.material': { $regex: 'ab', $options: 'i' } },
            { 'meta.request.sellerText': { $regex: 'ab', $options: 'i' } }
          ]
        }
      },
      { $limit: 5 }
    ]
  },
  // --- distribution module -------------------------------------------------
  {
    id: 'transmittals (drivers + plate)',
    endpoint: 'GET /api/v1/transmittals/',
    where: 'transmittal.controller.ts:457',
    collection: 'transmittals',
    kind: 'find',
    query: {
      team: TEAM,
      $or: [
        { 'transporter.driver': { $in: [DRIVER] } },
        { 'transporter.patent': { $regex: 'AB', $options: 'i' } }
      ]
    }
  },
  {
    id: 'transmittals (plate only)',
    endpoint: 'GET /api/v1/transmittals/',
    where: 'transmittal.controller.ts:460',
    collection: 'transmittals',
    kind: 'find',
    query: { team: TEAM, 'transporter.patent': { $regex: 'AB', $options: 'i' } }
  },
  // --- app module ----------------------------------------------------------
  {
    id: 'company/cars (?search)',
    endpoint: 'GET /api/v1/company/cars/',
    where: 'car.controller.ts:4101',
    collection: 'cars',
    kind: 'find',
    query: {
      $and: [{ $or: [{ vin: { $regex: /AB/i } }, { brand: { $regex: /AB/i } }] }, { team: TEAM }]
    }
  },
  {
    id: 'check-vin (vin2 substr, unanchored)',
    endpoint: 'POST /api/v1/check-vin/',
    where: 'car.controller.ts:320',
    collection: 'cars',
    kind: 'find',
    query: { $and: [{ team: TEAM }, { vin2: { $regex: /12345/i } }] }
  },
  {
    id: 'check-vin (vin2 end-anchored)',
    endpoint: 'POST /api/v1/check-vin/',
    where: 'car.controller.ts:502',
    collection: 'cars',
    kind: 'find',
    query: { $and: [{ team: TEAM }, { vin2: { $regex: '45678$', $options: 'i' } }] }
  },
  {
    id: 'check-vin (patent regex $or)',
    endpoint: 'POST /api/v1/check-vin/',
    where: 'car.controller.ts:510',
    collection: 'cars',
    kind: 'find',
    query: { $and: [{ team: TEAM }, { $or: [{ vin2: 'ABC123' }, { patent: { $regex: new RegExp('abc123', 'i') } }] }] }
  }
];

suite('DocDB /api/v1 mobile query shapes', function () {
  this.timeout(60000);
  let client: MongoClient;
  let db: Db;

  before(async () => {
    client = new MongoClient(URI as string);
    await client.connect();
    db = client.db();
  });

  after(async () => {
    if (client) await client.close();
  });

  /** Run the shape; return null if DocDB accepted it, else the error message. */
  async function runShape(s: Shape): Promise<string | null> {
    try {
      if (s.kind === 'aggregate') {
        await db.collection(s.collection).aggregate(s.query, { allowDiskUse: true }).toArray();
      } else {
        await db.collection(s.collection).find(s.query).limit(5).toArray();
      }
      return null;
    } catch (err: any) {
      return String(err && err.message);
    }
  }

  /**
   * DocumentDB's explain tree differs from MongoDB's: the access method
   * (IXSCAN/COLLSCAN) is nested under SUBSCAN/inputStage chains, and it does NOT
   * populate totalDocsExamined. So we recursively walk the tree, collect the
   * stage chain + any indexName, and derive the real access method — that is the
   * signal for "did the team index bound this regex, or is it a full scan?".
   */
  function summarizePlan(explain: any): string {
    const chain: string[] = [];
    const indexes: string[] = [];
    let nReturned: any;
    let timeMs: any;
    const walk = (n: any) => {
      if (!n || typeof n !== 'object') return;
      if (Array.isArray(n)) return n.forEach(walk);
      if (typeof n.stage === 'string') {
        chain.push(n.stage);
        if (n.indexName) indexes.push(n.indexName);
      }
      if (n.nReturned !== undefined && nReturned === undefined) nReturned = n.nReturned;
      if (n.executionTimeMillisEstimate !== undefined && timeMs === undefined) timeMs = n.executionTimeMillisEstimate;
      for (const k of Object.keys(n)) {
        if (['inputStage', 'inputStages', 'innerStage', 'outerStage', 'child', 'children', 'stages', '$cursor', 'queryPlanner', 'winningPlan', 'executionStages', 'executionStats'].includes(k)) {
          walk(n[k]);
        }
      }
    };
    walk(explain);
    const access = chain.includes('COLLSCAN')
      ? 'COLLSCAN (full scan)'
      : indexes.length
        ? `IXSCAN(${Array.from(new Set(indexes)).join(',')})`
        : chain.includes('IXSCAN')
          ? 'IXSCAN(unnamed)'
          : '?';
    return `access=${access}  chain=${chain.join('>') || 'n/a'}  nReturned=${nReturned ?? '?'}  timeMs=${timeMs ?? '?'}`;
  }

  /** Runs explain and surfaces the DocDB access method; set DOCDB_EXPLAIN_RAW=1 to dump full JSON. */
  async function reportPlan(s: Shape): Promise<void> {
    try {
      const explain =
        s.kind === 'aggregate'
          ? await db.command({ explain: { aggregate: s.collection, pipeline: s.query, cursor: {} }, verbosity: 'executionStats' })
          : await db.command({ explain: { find: s.collection, filter: s.query, limit: 5 }, verbosity: 'executionStats' });
      // eslint-disable-next-line no-console
      console.log(`      plan[${s.id}]: ${summarizePlan(explain)}`);
      if (process.env.DOCDB_EXPLAIN_RAW) {
        // eslint-disable-next-line no-console
        console.log(`      raw[${s.id}]: ${JSON.stringify(explain.queryPlanner ?? explain.stages ?? explain).slice(0, 900)}`);
      }
    } catch (e: any) {
      // eslint-disable-next-line no-console
      console.log(`      plan[${s.id}]: explain unavailable (${String(e && e.message).slice(0, 80)})`);
    }
  }

  for (const s of SHAPES) {
    it(`accepts & executes: ${s.endpoint}  [${s.where}]`, async () => {
      const err = await runShape(s);
      expect(err, `DocDB rejected the mobile query shape "${s.id}" — ${err}`).to.equal(null);
      await reportPlan(s);
    });
  }
});
