import * as mongoose from 'mongoose';
import {AggregatePaginateModel, PaginateModel} from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate-v2';
import {ITransmittalItem} from '../interfaces/transmittalItem.interface';
import mongooseAggregatePaginate = require('mongoose-aggregate-paginate-v2');

export interface ITransmittalItemModel extends ITransmittalItem, mongoose.Document {}

export enum ChoicesStatusTransmittalItem {
  pending = 'pending',
  completed = 'completed',
}

export const choicesStatusTransmittalItem = [
  ChoicesStatusTransmittalItem.pending,
  ChoicesStatusTransmittalItem.completed,
];

const transmittalItemSchema = new mongoose.Schema({
  transmittal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transmittal'
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  request: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Request'
  },
  requestItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RequestItem'
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
  revisions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Participant'
  }],
  loadingDate: {
    type: Date
  },
  arrivalDate: {
    type: Date
  },
  observation: {
    type: String
  },
  status: {
    type: String,
    enum: choicesStatusTransmittalItem,
    default: ChoicesStatusTransmittalItem.pending
  }
}, {
  timestamps: true
});

transmittalItemSchema.index({ team: 1, 'transporter.driver': 1, status: 1 });
transmittalItemSchema.index({ team: 1 });
transmittalItemSchema.index({ transmittal: 1 });
transmittalItemSchema.index({ car: 1 });
transmittalItemSchema.index({ request: 1 });
transmittalItemSchema.index({ revisions: 1 });
transmittalItemSchema.index({ destination: 1 });
transmittalItemSchema.index({ origin: 1 });

transmittalItemSchema.set<any>('redisCache', process.env.ENV === 'production');
transmittalItemSchema.set<any>('expires', 30);

transmittalItemSchema.plugin(mongoosePaginate);
transmittalItemSchema.plugin(mongooseAggregatePaginate);

export type TransmittalItemSchema =
  mongoose.Model<ITransmittalItemModel>
  & PaginateModel<ITransmittalItemModel>
  & AggregatePaginateModel<ITransmittalItemModel>;

const TransmittalItem = mongoose.model<ITransmittalItemModel, TransmittalItemSchema>('TransmittalItem', transmittalItemSchema);

export default TransmittalItem;
