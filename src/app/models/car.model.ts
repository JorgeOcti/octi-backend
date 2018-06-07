import * as mongoose from 'mongoose';
import {ICar} from "../../interfaces/car.interface";

export interface ICarModel extends ICar, mongoose.Document {}

const carSchema = new mongoose.Schema({
  vin: {
    type: String,
    trim: true,
    required: true
  }
}, {
  timestamps: true
});

carSchema.statics.findOneOrCreate = function (condition: any, create: any): Promise<ICarModel> {
  const model = this;
  return new Promise((resolve, reject) => {
    model.findOne(condition, (err: any, result: ICarModel) => {
      if (err) return reject(err);
      if (result) return resolve(result);
      model.create(create, (err: any, result: ICarModel) => {
        if (err) return reject(err);
        return resolve(result);
      });
    });
  });
};

export type CarSchema = mongoose.Model<ICarModel> & {
  findOneOrCreate(condition: any, create: any): Promise<ICarModel>
}

const Car = mongoose.model<ICarModel, CarSchema>('Car', carSchema);

export default Car;
