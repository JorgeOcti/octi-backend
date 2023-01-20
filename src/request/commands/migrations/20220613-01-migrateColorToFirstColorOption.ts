import * as bluebird from 'bluebird';
import * as dotenv from 'dotenv';
import * as mongoose from 'mongoose';
import * as path from 'path';

import { Car } from '../../../app/models/car.model';
import { IRequestItemModel } from '../../models/requestItem.model';
import logger from '../../../services/logger.service';

async function migrateFirstColor() {
  dotenv.config({
    path: path.join(__dirname, '../../../.env')
  });
  const MONGODB_URI: string = process.env.MONGODB_URI || '';
  (mongoose as any).Promise = bluebird;
  await mongoose.connect(MONGODB_URI, {});
  mongoose.set('debug', false);
  try {
    // 5bf2de34caf8ef7096105cda = Derco
    // 5bf2de35caf8ef7096105cdd = Salfa
    // const teams = ['5bf2de34caf8ef7096105cda'];
    const teams: string[] = [];

    let extraFilter: any = {};
    if (teams.length) {
      extraFilter['team'] = { $in: teams.map((team) => (new mongoose.Types.ObjectId(team))) };
    }
    // const bulk = Car.collection.initializeOrderedBulkOp();
    const toUpdateCars: any[] = [];
    const carsCursor = Car
      .aggregate<IRequestItemModel>([{
        $match: {
          ...extraFilter
        }
      }, {
        $addFields: { firstColorOption: { $toString: '$color' } }
      }, {
        $project: {
          '_id': 1,
          'firstColorOption': 1,
        }
      }, {
        $sort: { _id: 1 }
      }])
      .allowDiskUse(true)
      .cursor()

    await carsCursor.eachAsync(async (car: any) => {
      const action = {
        updateOne: {
          filter: { _id: car._id },
          update: {
            firstColorOption: car.firstColorOption
          }
        }
      };
      logger.info(`migrateFirstColor.data ${JSON.stringify(action)}`);
      toUpdateCars.push(action);
    });

    carsCursor.close();
    logger.info(`toUpdateCars ${toUpdateCars.length}`);
    await Car.bulkWrite(toUpdateCars);
    process.exit(1);


  } catch (e) {
    console.log('Ha ocurrido un error en migrateFirstColor');
    console.log('error:', e);
  }
}

migrateFirstColor!();
