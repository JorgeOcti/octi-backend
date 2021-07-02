import * as bluebird from 'bluebird';
import * as dotenv from 'dotenv';
import * as mongoose from 'mongoose';
import * as path from 'path';

import Car from "../models/car.model";
import InventoryCar from "../../inventory/models/inventoryCar.model";
import RequestItem from "../../request/models/requestItem.model";
import Participant from "../../form/models/participant.model";
import StockCar from "../../inventory/models/stockCar.model";
import Planning from "../../planning/models/planning.model";
import Team from "../models/team.model";

// import ActivityHistory, { ChoicesTypeActivity } from '../models/activityHistory.model';

async function fixDuplicatesCar() {
  try {
    dotenv.config({
      path: path.join(__dirname, '../../../.env')
    });
    const MONGODB_URI: string = process.env.MONGODB_URI || '';
    (mongoose as any).Promise = bluebird;
    await mongoose.connect(MONGODB_URI, {useNewUrlParser: true, useUnifiedTopology: true});
    mongoose.set('debug', true);
    // const team = mongoose.Types.ObjectId("5bf2de34caf8ef7096105cda");
    const teams = await Team.find({});
    for (const team of teams) {
      const cars = await Car.aggregate([{
        $match: {
          team: team._id
        }
      }, {
        $group: {
          _id: "$vin",
          count: {$sum: 1}
        }
      }, {
        $match: {
          count: {$ne: 1}
        }
      }]);
      if (cars) {
        for (const car of cars) {
          if (car._id && car._id.length) {
            const carsByVIN = await Car.find({vin: car._id, team: team._id}, {sort: '-created_at'});
            let firstCar = undefined;
            for (const carByVIN of carsByVIN) {
              console.log('carByVIN', carByVIN);
              if (firstCar === undefined) {
                firstCar = carByVIN;
              } else {
                await InventoryCar.update({car: carByVIN._id}, {$set: {car: firstCar._id}});
                await RequestItem.update({car: carByVIN._id}, {$set: {car: firstCar._id}});
                await Participant.update({car: carByVIN._id}, {$set: {car: firstCar._id}});
                await StockCar.update({car: carByVIN._id}, {$set: {car: firstCar._id}});
                await Planning.update({car: carByVIN._id}, {$set: {car: firstCar._id}});
                await Car.findByIdAndDelete(carByVIN._id);
              }
            }
          }
        }
      }
    }
  } catch (e) {
    console.log(e);
    process.exit(1);
  }
  process.exit(1);
}

fixDuplicatesCar();
