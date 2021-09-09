import * as mongoose from 'mongoose';
import { PaginateModel } from 'mongoose';
import { IRequestStatus } from '../interfaces/requestStatus.interface';
import { ICarModel } from '../../app/models/car.model';

export interface IRequestStatusModel extends IRequestStatus, mongoose.Document {
}

const requestStatusSchema = new mongoose.Schema({
  name: {
    type: String
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  default: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

requestStatusSchema.statics.findOneOrCreate = function(condition: any, create: any): Promise<ICarModel> {
  const model = this;
  return new Promise((resolve, reject) => {
    model.findOne(condition, (err: any, result: ICarModel) => {
      if (err) {
        return reject(err);
      }
      if (result) {
        return resolve(result);
      }
      model.create(create, (err: any, result: ICarModel) => {
        if (err) {
          return reject(err);
        }
        return resolve(result);
      });
    });
  });
};

export type RequestStatusSchema = mongoose.Model<IRequestStatusModel> & PaginateModel<IRequestStatusModel> & {
  findOneOrCreate(condition: any, create: any): Promise<ICarModel>
};

const RequestStatus = mongoose.model<IRequestStatusModel, RequestStatusSchema>('RequestStatus', requestStatusSchema);

export default RequestStatus;

