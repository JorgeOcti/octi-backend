import * as mongoose from 'mongoose';
import {PaginateModel} from 'mongoose';
import {ISalesChannel} from '../interfaces/salesChannel.interface';
import {ICarModel} from '../../app/models/car.model';

export interface ISalesChannelModel extends ISalesChannel, mongoose.Document {}

const salesChannelSchema = new mongoose.Schema({
  name: {
    type: String
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  fleet: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

export type SalesChannelSchema = mongoose.Model<ISalesChannelModel> & PaginateModel<ISalesChannelModel> & {
  findOneOrCreate(condition: any, create: any): Promise<ICarModel>
};

const SalesChannel = mongoose.model<ISalesChannelModel, SalesChannelSchema>('SalesChannel', salesChannelSchema);

export default SalesChannel;

