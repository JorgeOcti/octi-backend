import * as mongoose from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate-v2';

import { AggregatePaginateModel, PaginateModel } from 'mongoose';

import type { IRequestItem } from '../interfaces/requestItem.interface';
import { baseCarSchema } from '../../app/models/car.model';
import { baseRequestItemStatusSchema } from './requestItemStatus.model';
import { baseUserSchema } from '../../app/schemas/user.schema';
import { baseVenueSchema } from '../../app/models/venue.model';
import requestItemsHooks from './requestItem.hooks';
import { requestSchema } from './request.model';
import { transmittalSchema } from '../../distribution/models/transmittal.model';

import mongooseAggregatePaginate = require('mongoose-aggregate-paginate-v2');

export interface IRequestItemModel extends IRequestItem, mongoose.Document<any> {
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

requestItemSchema.index({
  team: 1,
  'meta.request.number': -1,
  origin: 1,
  destination: 1,
  createdAt: 1
});

requestItemSchema.index({ car: 1, team: 1, _id: -1 });
requestItemSchema.index({ transmittal: 1, team: 1, _id: -1 });
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
