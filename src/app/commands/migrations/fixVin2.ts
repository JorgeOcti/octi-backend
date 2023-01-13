import * as bluebird from 'bluebird';
import * as dotenv from 'dotenv';
import * as mongoose from 'mongoose';
import * as path from 'path';
import Car from '../../models/car.model';

async function fixVin2() {
  dotenv.config({
    path: path.join(__dirname, '../../../.env')
  });
  const MONGODB_URI: string = process.env.MONGODB_URI || '';
  (mongoose as any).Promise = bluebird;
  await mongoose.connect(MONGODB_URI);
  mongoose.set('debug', true);
  const cars = await Car.find({vin2: {$exists: false}});

  for (const car of cars) {
    if(car.vin?.length && !car.vin2?.length){
      console.log('car.vin');
      car.vin2 = car.vin.substr(car.vin.length - 6);
      await car.save();
    }
  }
  process.exit(1);
}

fixVin2();
