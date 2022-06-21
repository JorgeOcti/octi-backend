import * as bluebird from 'bluebird';
import * as dotenv from 'dotenv';
import * as mongoose from 'mongoose';
import * as path from 'path';
import RequestItem from '../../models/requestItem.model';
import Request from '../../models/request.model';

async function migrateRequestItemOrder() {
  dotenv.config({
    path: path.join(__dirname, '../../../.env')
  });
  const MONGODB_URI: string = process.env.MONGODB_URI || '';
  (mongoose as any).Promise = bluebird;
  await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  mongoose.set('debug', false);
  try {
    const requests = await Request
      .find({}, { _id: true, number: true });
    for (const request of requests) {
      console.log('request', request.number)
      const requestItems = await RequestItem.find({ request: request._id });
      let order = 0;
      for (const items of requestItems) {
        order++;
        await RequestItem.findOneAndUpdate({ _id: items._id }, {
          $set: {
            order,
            code: `${request.number}-${order}`
          }
        });
      }
    }
  } catch (e) {
    console.log('Ha ocurrido un error en migrateRequestItemOrder');
    console.log('error:', e);
    await process.exit(1);
  }
}

migrateRequestItemOrder();
