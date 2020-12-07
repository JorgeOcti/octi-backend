import * as mongoose from 'mongoose';
import {AggregatePaginateModel, PaginateModel} from 'mongoose';
import {IRequestItem} from '../../interfaces/requestItem.interface';
import * as mongoosePaginate from 'mongoose-paginate';
import mongooseAggregatePaginate = require('mongoose-aggregate-paginate-v2');

export interface IRequestItemModel extends IRequestItem, mongoose.Document {}

const requestItemSchema = new mongoose.Schema({
  request: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Request'
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  origin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Venue'
  },
  destination: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Venue'
  },
  position: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Venue'
  },
  car: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Car'
  },
  reason: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reason'
  },
  carrier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Carrier'
  },
  priority: {
    type: Boolean,
    default: false
  },
  observation: {
    type: String,
    default: ''
  },
  equipment: {
    type: Boolean,
    default: false
  },
  washed: {
    type: Boolean,
    default: false
  },
  review: {
    type: Boolean,
    default: false
  },
  body: {
    type: Boolean,
    default: false
  },
  uploadDate: {
    type: Date
  },
  estimatedArrival: {
    type: Date
  },
  status: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RequestItemStatus'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

requestItemSchema.plugin(mongoosePaginate);
requestItemSchema.plugin(mongooseAggregatePaginate);

export type RequestItemSchema = mongoose.Model<IRequestItemModel> & PaginateModel<IRequestItemModel> & AggregatePaginateModel<IRequestItemModel>;

const RequestItem = mongoose.model<IRequestItemModel, RequestItemSchema>('RequestItem', requestItemSchema);

export default RequestItem;

