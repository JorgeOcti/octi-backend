import { IRequestItemStatus } from 'interfaces/requestItemStatus.interface';
import * as mongoose from 'mongoose';
import { PaginateModel } from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate';
import { ICarModel } from '../../app/models/car.model';

export interface IRequestItemStatusModel extends IRequestItemStatus, mongoose.Document {}

const requestItemStatusSchema = new mongoose.Schema({
  name: {
    type: String
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  weigth: {
    type: Number,
    required: true
  },
  default: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

requestItemStatusSchema.statics.findOneOrCreate = function(condition: any, create: any): Promise<ICarModel> {
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

requestItemStatusSchema.plugin(mongoosePaginate);

export type RequestItemStatusSchema = mongoose.Model<IRequestItemStatusModel> & PaginateModel<IRequestItemStatusModel> & {
  findOneOrCreate(condition: any, create: any): Promise<ICarModel>
};

const RequestItemStatus = mongoose.model<IRequestItemStatusModel, RequestItemStatusSchema>('RequestItemStatus', requestItemStatusSchema);

export default RequestItemStatus;

