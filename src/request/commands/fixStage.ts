import * as bluebird from 'bluebird';
import * as dotenv from 'dotenv';
import * as mongoose from 'mongoose';
import * as path from 'path';
import Request from '../../request/models/request.model';
import RequestItem from '../../request/models/requestItem.model';

async function migrateSalfa() {
  dotenv.config({
    path: path.join(__dirname, '../../../.env')
  });
  const MONGODB_URI: string = process.env.MONGODB_URI || '';
  (mongoose as any).Promise = bluebird;
  await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  mongoose.set('debug', true);
  try {
    const requests = await Request.find({ team: '5bf2de35caf8ef7096105cdd' }, { _id: true });
    await RequestItem.deleteMany({ team: '5bf2de35caf8ef7096105cdd', request: { $nin: requests.map((r) => r.id) } });
  } catch (e) {
    console.log('Ha ocurrido un error en migrateSalfa');
    console.log('error:', e);
  }
  await process.exit(1);
}

migrateSalfa();
