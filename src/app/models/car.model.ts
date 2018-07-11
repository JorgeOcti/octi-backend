import * as mongoose from 'mongoose';
import {ICar} from "../../interfaces/car.interface";
import * as mongoosePaginate from "mongoose-paginate";
import {PaginateModel} from "mongoose";

export interface ICarModel extends ICar, mongoose.Document {}

const carSchema = new mongoose.Schema({
  vin: {
    type: String,
    trim: true,
    required: true
  },
  vin2: {
    type: String,
    trim: true,
    required: true
  },
  brand: {
    type: String,
    trim: true,
  },
  denomination: {
    type: String,
    trim: true,
  },
  color: {
    type: String,
    trim: true,
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },
  lastForm: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Participant',
    default: null
  }
}, {
  timestamps: true
});

carSchema.index({vin: 1}, {unique: true});
carSchema.index({company: 1, vin2: 1}, {unique: true});
carSchema.index({company: 1, vin: 1}, {unique: true});

carSchema.virtual('participants', {
  ref: 'Participant', // The model to use
  localField: '_id', // Find field in this model
  foreignField: 'car', // is equal to field in another model
  justOne: false
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

carSchema.plugin(mongoosePaginate);

export type CarSchema = mongoose.Model<ICarModel> & PaginateModel<ICarModel> & {
  findOneOrCreate(condition: any, create: any): Promise<ICarModel>
}

const Car = mongoose.model<ICarModel, CarSchema>('Car', carSchema);

export default Car;
