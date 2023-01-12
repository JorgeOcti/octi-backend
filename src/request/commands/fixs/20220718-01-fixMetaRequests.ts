import * as bluebird from 'bluebird';
import * as dotenv from 'dotenv';
import * as mongoose from 'mongoose';
import * as path from 'path';

import RequestItem from '../../models/requestItem.model';
import requestItemsHooks from '../../models/requestItem.hooks';

async function metaRequests() {
  dotenv.config({
    path: path.join(__dirname, '../../../.env')
  });
  const MONGODB_URI: string = process.env.MONGODB_URI || '';
  (mongoose as any).Promise = bluebird;
  await mongoose.connect(MONGODB_URI, {});
  mongoose.set('debug', false);
  try {
    const requestsItemsCursor = RequestItem
      .aggregate([{
        $project: {
          _id: true,
          request: true,
          transmittal: true,
          car: true,
          createdBy: true,
          origin: true,
          destination: true,
          status: true
        }
      }])
      .allowDiskUse(true)
      .cursor()

    await requestsItemsCursor.eachAsync(async (requestITem: any) => {
      // console.log(request.createdAt)
      try {
        await requestItemsHooks.postFindOneAndUpdateHandler(requestITem);
      } catch (e) {
        console.log('error:', e);
      }
    });
    console.log('Terminado');
  } catch (e) {
    console.log(e);
    console.log('Ha ocurrido un error en metaRequests');
    process.exit(1);
    console.log('error:', e);
  }
}

metaRequests!();
