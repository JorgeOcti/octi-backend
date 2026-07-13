/**
 * DocumentDB compatibility contract tests.
 *
 * These run the aggregation *shapes* our controllers rely on against a real
 * DocumentDB instance and assert DocDB accepts them. Static analysis
 * (scripts/docdb-audit.js) flags suspect shapes; this suite is the ground
 * truth — it catches what static rules can't (e.g. nested $lookup in a
 * pipeline, which DocDB accepts in some forms and rejects in others).
 *
 * The suite is SKIPPED unless DOCDB_TEST_URI points at a reachable DocDB.
 * Locally, bring up the bastion tunnel (localhost:27018) and run:
 *
 *   DOCDB_TEST_URI="mongodb://osacontrol:<pwd>@localhost:27018/osaAndes?\
 *     tls=true&tlsCAFile=./global-bundle.pem&tlsAllowInvalidHostnames=true&\
 *     directConnection=true&retryWrites=false&authSource=admin" \
 *   npm test -- --grep "DocDB compat"
 *
 * In CI, point it at a DocDB reachable from an in-VPC runner. Normal `npm test`
 * runs (no env var) skip the suite so they stay green off-VPC.
 */
import { MongoClient, Db } from 'mongodb';
import * as chai from 'chai';

const expect = chai.expect;

const URI = process.env.DOCDB_TEST_URI;
const suite = URI ? describe : describe.skip;

/** DocDB rejects unsupported aggregation shapes with these message fragments. */
const DOCDB_UNSUPPORTED = [
  'not supported',
  'concise correlated subquery',
  'multiple join conditions'
];

suite('DocDB compat', function () {
  this.timeout(30000);
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

  /** Runs a pipeline; resolves to the DocDB error message, or null if accepted. */
  async function docdbError(collection: string, pipeline: any[]): Promise<string | null> {
    try {
      await db.collection(collection).aggregate(pipeline, { allowDiskUse: true }).toArray();
      return null;
    } catch (err: any) {
      const msg = String(err && err.message);
      if (DOCDB_UNSUPPORTED.some((frag) => msg.toLowerCase().includes(frag))) {
        return msg;
      }
      throw err; // an unexpected error (not a compatibility rejection)
    }
  }

  const assertAccepted = async (collection: string, pipeline: any[]) => {
    const err = await docdbError(collection, pipeline);
    expect(err, `DocDB rejected the pipeline: ${err}`).to.equal(null);
  };

  const assertRejected = async (collection: string, pipeline: any[]) => {
    const err = await docdbError(collection, pipeline);
    expect(err, 'expected DocDB to reject this shape but it was accepted').to.be.a('string');
  };

  // --- positive control: the compatible forms our fixes should use ----------

  it('accepts a basic $lookup (localField/foreignField, no pipeline)', async () => {
    await assertAccepted('inventorycars', [
      { $limit: 1 },
      { $lookup: { from: 'cars', localField: 'car', foreignField: '_id', as: 'car' } }
    ]);
  });

  it('accepts the DocDB-safe rewrite: basic $lookup + $unwind + post-$match + sequential nested $lookup', async () => {
    // This is the pattern every correlated/concise $lookup must be rewritten to.
    // Verified acceptable on DocDB; correlated let+pipeline (below) is not.
    await assertAccepted('cars', [
      { $limit: 1 },
      // "histories where car == _id AND status inTransit" -> basic join + post-filter
      { $lookup: { from: 'histories', localField: '_id', foreignField: 'car', as: 'histories' } },
      { $unwind: { path: '$histories', preserveNullAndEmptyArrays: true } },
      { $match: { $or: [{ 'histories.status': 'inTransit' }, { histories: { $exists: false } }] } },
      // nested "history.inventoryCar" join -> another sequential basic $lookup
      { $lookup: { from: 'inventorycars', localField: 'histories.inventoryCar', foreignField: '_id', as: 'histories.inventoryCar' } },
      { $unwind: { path: '$histories.inventoryCar', preserveNullAndEmptyArrays: true } },
      { $group: { _id: '$_id', histories: { $push: '$histories' } } }
    ]);
  });

  // --- negative controls: the shapes our controllers use today -------------
  // These document the exact limitations. They should flip to assertAccepted
  // (with the rewritten shape) as each controller is fixed.

  it('rejects concise-correlated $lookup (localField+foreignField+pipeline)', async () => {
    await assertRejected('inventorycars', [
      { $limit: 1 },
      {
        $lookup: {
          from: 'participants',
          localField: 'units.participant',
          foreignField: '_id',
          as: 'units.participant',
          pipeline: [{ $project: { name: 1 } }]
        }
      }
    ]);
  });

  it('rejects any correlated let+pipeline $lookup (DocDB has no support, even single-condition)', async () => {
    // Confirmed empirically: DocDB rejects correlated let/pipeline lookups with
    // "$lookup on multiple join conditions" regardless of how many conditions —
    // so the whole form must be flattened, not just simplified.
    await assertRejected('cars', [
      { $limit: 1 },
      {
        $lookup: {
          from: 'histories',
          let: { carId: '$_id' },
          pipeline: [{ $match: { $expr: { $eq: ['$car', '$$carId'] } } }],
          as: 'histories'
        }
      }
    ]);
  });
});
