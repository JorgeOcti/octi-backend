import { IRequestItemStatus } from '../interfaces/requestItemStatus.interface';
import * as mongoose from 'mongoose';
import { PaginateModel } from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate-v2';
import requestItemStatusHooks from './requestItemStatus.hooks';

export interface IRequestItemStatusModel extends IRequestItemStatus, mongoose.Document {}

export const baseRequestItemStatusSchema = new mongoose.Schema({
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
  }
});

export const requestItemStatusSchema = new mongoose.Schema({
  ...baseRequestItemStatusSchema.obj,
  default: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

requestItemStatusSchema.statics.findOneOrCreate = function(condition: any, create: Partial<IRequestItemStatusModel>): Promise<IRequestItemStatusModel> {
  const model = this;
  return new Promise((resolve, reject) => {
    model.findOne(condition, (err: any, result: IRequestItemStatusModel) => {
      if (err) {
        return reject(err);
      }
      if (result) {
        return resolve(result);
      }
      model.create(create, (err: any, result: IRequestItemStatusModel) => {
        if (err) {
          return reject(err);
        }
        return resolve(result);
      });
    });
  });
};

requestItemStatusSchema.plugin(mongoosePaginate);

requestItemStatusSchema.post<IRequestItemStatusModel>('findOneAndUpdate', async (doc: any) => {
  console.log('******************** REQUET ITEM findOneAndUpdate *******************');
  console.log(doc);
  await requestItemStatusHooks.postFindOneAndUpdateHandler(doc);
});

export type RequestItemStatusSchema = mongoose.Model<IRequestItemStatusModel> & PaginateModel<IRequestItemStatusModel> & {
  findOneOrCreate(condition: any, create: Partial<IRequestItemStatusModel>): Promise<IRequestItemStatusModel>
};

const RequestItemStatus = mongoose.model<IRequestItemStatusModel, RequestItemStatusSchema>('RequestItemStatus', requestItemStatusSchema);

export default RequestItemStatus;

