import * as bluebird from 'bluebird';
import * as dotenv from 'dotenv';
import * as mongoose from 'mongoose';
import * as path from 'path';
import RequestItem from '../../request/models/requestItem.model';

async function metaRequests() {
  dotenv.config({
    path: path.join(__dirname, '../../../.env')
  });
  const MONGODB_URI: string = process.env.MONGODB_URI || '';
  (mongoose as any).Promise = bluebird;
  await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  mongoose.set('debug', true);
  try {
    const requestItems = await RequestItem.find({ });
    for (const requestItem of requestItems) {
      try {
        const newRequestItem = await RequestItem.findOneAndUpdate({_id: requestItem._id},{})
        console.log(newRequestItem);
      } catch (e) {
        console.log('error:', e);
      }
    }
  } catch (e) {
    console.log('Ha ocurrido un error en metaRequests');
    console.log('error:', e);
  }
  await process.exit(1);
}

metaRequests();
