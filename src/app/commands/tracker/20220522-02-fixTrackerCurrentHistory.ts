import * as bluebird from 'bluebird';
import * as dotenv from 'dotenv';
import * as mongoose from 'mongoose';
import * as path from 'path';
import { Car } from '../../models';
import carTracker from '../../controllers/tracker/car.tracker';
import History from '../../models/history.model';

async function fixTrackerCurrentHistory() {
  dotenv.config({
    path: path.join(__dirname, '../../../.env')
  });
  const MONGODB_URI: string = process.env.MONGODB_URI || '';
  (mongoose as any).Promise = bluebird;
  await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  mongoose.set('debug', false);
  try {
    // 5bf2de34caf8ef7096105cda = Derco
    const teams = ['5bf2de34caf8ef7096105cda'];
    const histories = await History
      .find({
        team: { $in: teams }
      }, {
        car: true
      });
    const carCursor = await Car
      .find({
        _id: {
          $in: histories.map((history)=>(history.car))
        },
        team: { $in: teams }
      }, { _id: true })
      .batchSize(100)
      .cursor();
    carCursor.on('data', async (car) => {
      await carTracker.updateCurrentHistory(car._id);
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
