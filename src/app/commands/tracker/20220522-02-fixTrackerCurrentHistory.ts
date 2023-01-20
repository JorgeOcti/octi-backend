import * as bluebird from 'bluebird';
import * as dotenv from 'dotenv';
import * as mongoose from 'mongoose';
import * as path from 'path';

import { Car } from '../../models/car.model';
import History from '../../models/history.model';
import { ICar } from '../../interfaces/car.interface';
import carTracker from '../../controllers/tracker/car.tracker';

async function fixTrackerCurrentHistory() {
  dotenv.config({
    path: path.join(__dirname, '../../../.env')
  });
  const MONGODB_URI: string = process.env.MONGODB_URI || '';
  (mongoose as any).Promise = bluebird;
  await mongoose.connect(MONGODB_URI, { });
  mongoose.set('debug', false);
  try {
    // 5bf2de34caf8ef7096105cda = Derco
    // 5bf2de35caf8ef7096105cdd = Salfa
    // const teams = ['5bf2de34caf8ef7096105cda'];
    const teams: any[] = [new mongoose.Types.ObjectId('5bf2de34caf8ef7096105cda')];
    // const team: string = mongoose.Types.ObjectId('5bf2de35caf8ef7096105cdd');

    let extraFilter: any = {};
    if (teams.length) {
      extraFilter['team'] = { $in: teams };
    }
    new History();
    const carCursor = Car
      .aggregate([{
        $match: {
          createdBy: { $exists: true },
          ...extraFilter
        }
      }, {
        $lookup: {
          from: 'histories', localField: '_id', foreignField: 'car', as: 'events'
        }
      },{
        $project: {
          _id: true,
          vin: true,
          createdBy: true,
          company: true,
          team: true,
          createdAt: true,
          // 'events.module': true,
          // 'events.status': true,
          // events: {
          //   $cond: {
          //     if: {
          //       $ne: [
          //         '$events.module', 'import'
          //       ]
          //     },
          //     then: {
          //       $size: '$events'
          //
          //     }, else: '0'
          //   }
          // }
        }
      }])
      .allowDiskUse(true)
      .cursor()
    await carCursor.eachAsync(async (car: ICar) => {
      try {
        if (car?.events?.filter((event) => (
          event?.module.includes('import') ||
          event?.status.includes('created')
        )).length === 0) {
          console.log(car);
          await carTracker.createImportHitory(car);
        }
      } catch (e) {
        console.log(e);
      }
    });
    console.log('terminado');
  } catch (e) {
    console.log('Ha ocurrido un error en fixTrackerCurrentHistory');
    console.log('error:', e);
    // process.exit(1);
  }

}

fixTrackerCurrentHistory!();
