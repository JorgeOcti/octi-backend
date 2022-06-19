import * as mongoose from 'mongoose';
import { AggregatePaginateModel, PaginateModel } from 'mongoose';
import { IRequestItem } from '../interfaces/requestItem.interface';
import * as mongoosePaginate from 'mongoose-paginate-v2';
import requestItemsHooks from './requestItem.hooks';
import { baseCarSchema, baseUserSchema, baseVenueSchema } from '../../app/models';
import { requestSchema } from './request.model';
import { baseRequestItemStatusSchema } from './';
import mongooseAggregatePaginate = require('mongoose-aggregate-paginate-v2');
import { transmittalSchema } from '../../distribution/models/transmittal.model';

export interface IRequestItemModel extends IRequestItem, mongoose.Document {
  createdAt: Date;
  updatedAt: Date;
}

const metaSchema = new mongoose.Schema({
  car: {
    type: baseCarSchema
  },
  request: {
    type: requestSchema
  },
  transmittal: {
    type: transmittalSchema
  },
  user: {
    type: baseUserSchema
  },
  origin: {
    type: baseVenueSchema
  },
  destination: {
    type: baseVenueSchema
  },
  status: {
    type: baseRequestItemStatusSchema
  }
});

const requestItemAnswerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId
  },
  question: {
    type: String
  },
  answer: {
    type: String
  }
});

const requestItemSchema = new mongoose.Schema({
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  order: {
    type: Number
  },
  code: {
    type: String
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'company'
  },
  request: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Request'
  },
  meta: {
    type: metaSchema,
    default: {}
  },
  transmittal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transmittal'
  },
  transmittalItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TransmittalItem'
  },
  // if assigned to transmittal
  assigned: {
    type: Boolean,
    default: false
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
  answers: {
    type: [requestItemAnswerSchema],
    default: []
  },
  files: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RequestFile'
  }],
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

requestItemSchema.set<any>('redisCache', process.env.ENV === 'production');
requestItemSchema.set<any>('expires', 30);

requestItemSchema.index({ team: 1 });
requestItemSchema.index({ company: 1 });
requestItemSchema.index({ request: 1 });
requestItemSchema.index({ car: 1 });
requestItemSchema.index({ origin: 1 });
requestItemSchema.index({ destination: 1 });
requestItemSchema.index({ channel: 1 });
requestItemSchema.index({ status: 1 });
requestItemSchema.index({ reason: 1 });
requestItemSchema.index({ carrier: 1 });
requestItemSchema.index({ reason: 1 });
requestItemSchema.index({ transmittal: 1 });
requestItemSchema.index({ transmittalitems: 1 });
requestItemSchema.index({ createdBy: 1 });
requestItemSchema.index({ createdAt: 1 });
requestItemSchema.index({ items: 1 });
requestItemSchema.index({
  request: 1,
  transmittal: 1,
  car: 1,
  createdBy: 1,
  origin: 1,
  destination: 1,
  status: 1,
  createdAt: -1
});
requestItemSchema.index({ 'request.channel': 1 });
requestItemSchema.index({ 'request.createdBy': 1 });
requestItemSchema.index({ 'meta.request.number': 1 });
requestItemSchema.index({ 'request.advancePaymentInformation.files': 1 });
requestItemSchema.index({ 'request.advancePaymentInformation.letters': 1 });
requestItemSchema.index({ 'request.advancePaymentInformation.method': 1 });
requestItemSchema.index({ 'advancePaymentInformation.files': 1 });
requestItemSchema.index({ 'advancePaymentInformation.letters': 1 });
requestItemSchema.index({ 'destination': 1, 'origin': 1, 'team': 1 });
requestItemSchema.index({ 'destination': 1, 'origin': 1, 'createdAt': 1 });

requestItemSchema.plugin(mongoosePaginate);
requestItemSchema.plugin(mongooseAggregatePaginate);

// requestItemSchema.pre<IRequestItemModel>('save', function(next: any) {
//   // const doc = this;
//   console.log('****************** REQUET ITEM save *********************');
//   // console.log(doc);
//   next();
// });

// requestItemSchema.post<IRequestItemModel>('update', async (doc: any) => {
//   console.log('******************* REQUET ITEM update ********************');
//   await requestItemsHooks.postUpdateHandler(doc);
// });

requestItemSchema.post<IRequestItemModel>('findOneAndUpdate', async (doc: any) => {
  // console.log('******************** REQUET ITEM findOneAndUpdate *******************');
  // console.log(doc);
  await requestItemsHooks.postFindOneAndUpdateHandler(doc);
});

export type RequestItemSchema = mongoose.Model<IRequestItemModel> & PaginateModel<IRequestItemModel> & AggregatePaginateModel<IRequestItemModel>;

export const RequestItem = mongoose.model<IRequestItemModel, RequestItemSchema>('RequestItem', requestItemSchema);

export default RequestItem;
