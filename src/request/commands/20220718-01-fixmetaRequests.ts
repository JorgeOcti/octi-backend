import * as bluebird from 'bluebird';
import * as dotenv from 'dotenv';
import * as mongoose from 'mongoose';
import * as path from 'path';
import RequestItem from '../../request/models/requestItem.model';
import requestItemsHooks from '../models/requestItem.hooks';
import Request from '../models/request.model';

async function metaRequests() {
  dotenv.config({
    path: path.join(__dirname, '../../../.env')
  });
  const MONGODB_URI: string = process.env.MONGODB_URI || '';
  (mongoose as any).Promise = bluebird;
  await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  mongoose.set('debug', false);
  try {
    const requestsCursor = Request
      .find({}, {
        _id: true,
        createdAt: true
      })
      .batchSize(2)
      .cursor();

    requestsCursor.on('data', async (request) => {
      // console.log(request.createdAt)
      const requestItems = await RequestItem.find({
        request: request._id,
        transmittal: {
          $exists: true
        }
      }, {
        request: true,
        transmittal: true,
        car: true,
        createdBy: true,
        origin: true,
        destination: true,
        status: true
      });
      for (const requestItem of requestItems) {
        console.log(requestItem.transmittal);
        try {
          await requestItemsHooks.postFindOneAndUpdateHandler(requestItem);
        } catch (e) {
          console.log('error:', e);
        }
      }
    });
    requestsCursor.on('end', async () => {
      process.exit(1);
    });
  } catch (e) {
    console.log('Ha ocurrido un error en metaRequests');
    console.log('error:', e);
  }
}

metaRequests();
