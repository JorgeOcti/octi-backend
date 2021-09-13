import * as mongoose from 'mongoose';
import {PaginateModel} from 'mongoose';
import {IRequest} from '../interfaces/request.interface';
import * as mongoosePaginate from 'mongoose-paginate';

export interface IRequestModel extends IRequest, mongoose.Document {}

const requestSchema = new mongoose.Schema({
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  number: {
    type: Number
  },
  origin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Venue'
  },
  destination: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Venue'
  },
  loadingDate: {
    type: Date
  },
  arrivalDate: {
    type: Date
  },
  sellerText: {
    type: String
  },
  channel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SalesChannel'
  },
  operationType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'OperationType'
  },
  fleet: {
    type: Boolean,
    default: false
  },
  // status: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'RequestStatus'
  // },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

requestSchema.virtual('items', {
  ref: 'RequestItem', // The model to use
  localField: '_id', // Find field in this model
  foreignField: 'request', // is equal to field in another model
  justOne: false
});

requestSchema.set('toObject', { virtuals: true });
requestSchema.set('toJSON', { virtuals: true });

requestSchema.plugin(mongoosePaginate);

export type RequestSchema = mongoose.Model<IRequestModel> & PaginateModel<IRequestModel>;

const Request = mongoose.model<IRequestModel, RequestSchema>('Request', requestSchema);

export default Request;

