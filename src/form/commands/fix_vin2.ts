import CarModel, {ICarModel} from '../../app/models/car.model';
import * as mongoose from 'mongoose';
import * as path from "path";
import * as dotenv from "dotenv";


async function updateVin2() {
  dotenv.config({
    path: path.join(__dirname, '../../../.env')
  });
  const MONGODB_URI: string = process.env.MONGODB_URI || '';
  await mongoose.connect(MONGODB_URI, {useMongoClient: true});
  const cars = await CarModel.find({});
  cars.forEach(function (x: ICarModel) {
    const vin2 = x.vin.substr(x.vin.length - 6);
    console.log(vin2);
    x.vin2 = vin2;
    x.save();
  });
}

updateVin2();

