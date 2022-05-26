import * as bluebird from 'bluebird';
import * as dotenv from 'dotenv';
import * as mongoose from 'mongoose';
import * as path from 'path';

import Inventory from '../../inventory/models/inventory.model';
import { Car } from '../models';
import History from '../models/history.model';

async function fixTrackerCurrentHistory() {
  dotenv.config({
    path: path.join(__dirname, '../../../.env')
  });
  const MONGODB_URI: string = process.env.MONGODB_URI || '';
  (mongoose as any).Promise = bluebird;
  await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  mongoose.set('debug', true);
  try {
    new Inventory({});
    const carCursor = await Car
      .find({}, { _id: true })
      .batchSize(20)
      .cursor();
    carCursor.on('data', async (car) => {
      const lastHistory = await History.findOne({ car: car._id }, { _id: true }, { sort: { 'executedAt': -1 } });
      if (lastHistory) {
        await History.updateMany({
          car: car._id,
          current: true
        }, {
          $set: { current: false }
        });
        await History.updateOne({
          _id: lastHistory?._id
        }, {
          $set: { current: false }
        });
      }
    });
    carCursor.on('end', async () => {
      process.exit(1);
    });
  } catch (e) {
    console.log('Ha ocurrido un error en fixTrackerCurrentHistory');
    console.log('error:', e);
  }

}

fixTrackerCurrentHistory();
