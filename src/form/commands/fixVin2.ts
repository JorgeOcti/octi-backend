import * as bluebird from 'bluebird';
import * as dotenv from 'dotenv';
import * as mongoose from 'mongoose';
import * as path from 'path';
import CarModel from '../../app/models/car.model';

async function updateVin2() {
  dotenv.config({
    path: path.join(__dirname, '../../../.env')
  });
  const MONGODB_URI: string = process.env.MONGODB_URI || '';
  (mongoose as any).Promise = bluebird;
  await mongoose.connect(MONGODB_URI, { useMongoClient: true });
  const cars = await CarModel.find({
    $expr: { $and: [{ $lt: [{ $strLenCP: '$vin2' }, 6] }, { $gt: [{ $strLenCP: '$vin' }, 15] }] },
    // team: '5bf2de35caf8ef7096105cdd'
  });
  for (const car of cars) {
    const vin2 = car.vin.substr(car.vin.length - 6);
    console.log(vin2);
    car.vin2 = vin2.toString();
    await car.save();
  }
  process.exit(1);
}

updateVin2();
