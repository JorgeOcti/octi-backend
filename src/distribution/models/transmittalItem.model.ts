import * as mongoose from 'mongoose';
import { PaginateModel } from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate';
import {ITransmittalItem} from '../../interfaces/transmittalItem.interface';

export interface ITransmittalItemModel extends ITransmittalItem, mongoose.Document { }

const transmittalItemSchema = new mongoose.Schema({
  name: {
    type: String
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  transmittal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transmittal'
  },
  origin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Venue'
  },
  destination: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Venue'
  },
  car: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Car'
  },
  invoice: {
    type: String
  },
  entry: {
    type: String
  },
}, {
  timestamps: true
});

transmittalItemSchema.plugin(mongoosePaginate);

export type TransmittalItemSchema = mongoose.Model<ITransmittalItemModel> & PaginateModel<ITransmittalItemModel>;

const TransmittalItem = mongoose.model<ITransmittalItemModel, TransmittalItemSchema>('TransmittalItem', transmittalItemSchema);

export default TransmittalItem;
