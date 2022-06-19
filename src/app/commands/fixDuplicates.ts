import * as bluebird from 'bluebird';
import * as dotenv from 'dotenv';
import * as mongoose from 'mongoose';
import * as path from 'path';
import Car from '../models/car.model';
import InventoryCar from '../../inventory/models/inventoryCar.model';
import RequestItem from '../../request/models/requestItem.model';
import Participant from '../../form/models/participant.model';
import StockCar from '../../inventory/models/stockCar.model';
import Planning from '../../planning/models/planning.model';
import TransmittalItem from '../../distribution/models/transmittalItem.model';
import Team from '../models/team.model';

// import ActivityHistory, { ChoicesTypeActivity } from '../models/activityHistory.model';

async function fixDuplicatesCar() {
  try {
    dotenv.config({
      path: path.join(__dirname, '../../../.env')
    });
    const MONGODB_URI: string = process.env.MONGODB_URI || '';
    (mongoose as any).Promise = bluebird;
    await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    mongoose.set('debug', false);
    // const team = mongoose.Types.ObjectId("5bf2de34caf8ef7096105cda");
    const teams = await Team.find({});
    for (const team of teams) {
      console.log('team', team.name);
      const cars = await Car.aggregate([{
        $match: {
          team: team._id,
          vin: {$ne: ""}
        }
      }, {
        $group: {
          _id: '$vin',
          count: { $sum: 1 }
        }
      }, {
        $match: {
          count: { $gt: 1 }
        }
      }, {
        $sort: {
          count: -1
        }
      }]);
      if (cars) {
        console.log('team', team.name);
        console.log('Duplicados', cars.length);
        for (const car of cars) {
          // console.log(car._id);
          if (car._id && car._id.length) {
            const carsByVIN = await Car
              .find({
                vin: car._id,
                team: team._id
              }).sort({ created_at: -1 });
            if (carsByVIN?.length > 1) {
              const current = carsByVIN[0];
              const duplicates = carsByVIN.splice(1, carsByVIN.length).map((duplicate)=>(duplicate._id));
              // console.log('carByVIN', carsByVIN);
              console.log('current.vin', current.vin);
              if(duplicates.length > 1){
                console.log('current._id', current._id);
                console.log('duplicates', duplicates);
              }
              // console.log('duplicates', duplicates.length);
              await Promise.all([
                InventoryCar.updateMany({ car: { $in: duplicates } }, { $set: { car: current._id } }),
                RequestItem.updateMany({ car: { $in: duplicates } }, { $set: { car: current._id } }),
                Participant.updateMany({ car: { $in: duplicates } }, { $set: { car: current._id } }),
                StockCar.updateMany({ car: { $in: duplicates } }, { $set: { car: current._id } }),
                Planning.updateMany({ car: { $in: duplicates } }, { $set: { car: current._id } }),
                TransmittalItem.updateMany({ car: { $in: duplicates } }, { $set: { car: current._id } }),
                Car.deleteMany({ _id: { $in: duplicates } })
              ]);
            }
            // for (const carByVIN of carsByVIN) {
            /*if (firstCar === undefined) {
              firstCar = carByVIN;
            } else {
              await Promise.all([
                InventoryCar.update({ car: carByVIN._id }, { $set: { car: firstCar._id } }),
                RequestItem.update({ car: carByVIN._id }, { $set: { car: firstCar._id } }),
                Participant.update({ car: carByVIN._id }, { $set: { car: firstCar._id } }),
                StockCar.update({ car: carByVIN._id }, { $set: { car: firstCar._id } }),
                Planning.update({ car: carByVIN._id }, { $set: { car: firstCar._id } }),
                Car.findByIdAndDelete(carByVIN._id)
              ]);
            }*/
            // }
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
