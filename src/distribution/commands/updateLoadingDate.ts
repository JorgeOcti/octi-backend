import * as bluebird from 'bluebird';
import * as dotenv from 'dotenv';
import * as mongoose from 'mongoose';
import * as path from 'path';
import TransmittalItem from '../models/transmittalItem.model';

// import ActivityHistory, { ChoicesTypeActivity } from '../models/activityHistory.model';

async function updateLoadingDate() {
  try {
    dotenv.config({
      path: path.join(__dirname, '../../../.env')
    });
    const MONGODB_URI: string = process.env.MONGODB_URI || '';
    (mongoose as any).Promise = bluebird;
    await mongoose.connect(MONGODB_URI, {useNewUrlParser: true, useUnifiedTopology: true});
    mongoose.set('debug', true);
    const transmittalItems = await TransmittalItem.find({});
    for (const transmittalItem of transmittalItems) {
      await transmittalItem.update({loadingDate: transmittalItem.createdAt})
    }
  } catch (e) {
    console.log(e);
    process.exit(1);
  }
  process.exit(1);
}

updateLoadingDate();
