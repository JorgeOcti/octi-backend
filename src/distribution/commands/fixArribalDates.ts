import * as bluebird from 'bluebird';
import * as dotenv from 'dotenv';
import * as mongoose from 'mongoose';
import * as path from 'path';
import TransmittalItem from '../models/transmittalItem.model';
import Transmittal from '../models/transmittal.model';
import Participant from '../../form/models/participant.model';

// import ActivityHistory, { ChoicesTypeActivity } from '../models/activityHistory.model';

async function updateArribalDate() {
  try {
    dotenv.config({
      path: path.join(__dirname, '../../../.env')
    });
    const MONGODB_URI: string = process.env.MONGODB_URI || '';
    (mongoose as any).Promise = bluebird;
    await mongoose.connect(MONGODB_URI, {useNewUrlParser: true, useUnifiedTopology: true});
    mongoose.set('debug', true);
    console.log(new Transmittal({}));
    console.log(new Participant({}));
    const transmittalItems = await TransmittalItem.find({}).populate([{
      path: 'transmittal',
      select: ['revision'],
      populate: [{
        path: 'revision',
        select: ['createdAt']
      }]
    }]);
    for (const transmittalItem of transmittalItems) {
      if(transmittalItem?.transmittal?.revision){
        await transmittalItem.update({arrivalDate: transmittalItem?.transmittal?.revision.createdAt})
      }
    }
  } catch (e) {
    console.log(e);
    process.exit(1);
  }
  process.exit(1);
}

updateArribalDate();
