import * as bluebird from 'bluebird';
import * as dotenv from 'dotenv';
import * as mongoose from 'mongoose';
import * as path from 'path';
import { Car, ChoicesStatusCar } from '../../models';
// import carTracker from '../../controllers/tracker/car.tracker';
import History from '../../models/history.model';
import { ICar } from '../../interfaces';
import conectaController from '../../../request/controllers/conecta.controller';

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
    // 5bf2de35caf8ef7096105cdd = Salfa
    // const teams = ['5bf2de34caf8ef7096105cda'];
    const teams: string[] = [mongoose.Types.ObjectId('5bf2de35caf8ef7096105cdd')];
    const team: string = mongoose.Types.ObjectId('5bf2de35caf8ef7096105cdd');

    let extraFilter: any = {};
    if (teams.length) {
      extraFilter['team'] = { $in: teams };
    }
    new History();
    const carCursor = Car
      .aggregate([{
        $match: {
          vin: { $exists: true },
          ...extraFilter
        }
      },/* {
        $lookup: {
          from: 'histories', localField: '_id', foreignField: 'car', as: 'events'
        }
      },*/{
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
      .cursor({ batchSize: 5 })
      .exec();
    carCursor.on('data', async (car: ICar) => {
      try {
        if (car?.vin?.length) {
          let { data: integrationData } = await conectaController.searchVinContecta(car.vin);
          if (integrationData?.length) {
            for (const car of integrationData) {
              await Car
                .updateOne({
                  team: team,
                  vin: car.vin
                }, {
                  $set: {
                    vin2: car.vin.substr(car.vin?.length - 5),
                    brand: car.brand,
                    denomination: car.denomination,
                    material: car.material,
                    color: car.color,
                    // company: req.user.company?._id,
                    status: ChoicesStatusCar.active
                  }
                }, {
                  upsert: true,
                  setDefaultsOnInsert: true
                });
            }
          }

        }
        /*if (car?.events?.filter((event) => (
          event?.module.includes('import') ||
          event?.status.includes('created')
        )).length === 0) {
          console.log(car);
          await carTracker.createImportHitory(car);
        }*/
      } catch (e) {
        console.log(e);
      }
    });
    carCursor.on('end', async () => {
      mongoose.set('debug', true);
      console.log('terminado');
      // process.exit(1);
    });
  } catch (e) {
    console.log('Ha ocurrido un error en fixTrackerCurrentHistory');
    console.log('error:', e);
    // process.exit(1);
  }

}

fixTrackerCurrentHistory!();
