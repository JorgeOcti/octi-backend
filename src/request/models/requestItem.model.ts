import * as mongoose from 'mongoose';
import { AggregatePaginateModel, PaginateModel } from 'mongoose';
import { IRequestItem } from '../interfaces/requestItem.interface';
import * as mongoosePaginate from 'mongoose-paginate';
import mongooseAggregatePaginate = require('mongoose-aggregate-paginate-v2');
import requestItemsHooks from './requestItem.hooks';
import { carSchema, userSchema } from '../../app/models';
import { requestSchema } from './request.model';

export interface IRequestItemModel extends IRequestItem, mongoose.Document {
  createdAt: Date;
  updatedAt: Date;
}

const metaSchema = new mongoose.Schema({
  car: {
    type: carSchema
  },
  request: {
    type: requestSchema
  },
  user: {
    type: userSchema
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

requestItemSchema.index({'meta.request.number': 1});

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
  console.log('******************** REQUET ITEM findOneAndUpdate *******************');
  console.log(doc);
  await requestItemsHooks.postFindOneAndUpdateHandler(doc);
});

export type RequestItemSchema = mongoose.Model<IRequestItemModel> & PaginateModel<IRequestItemModel> & AggregatePaginateModel<IRequestItemModel>;

const RequestItem = mongoose.model<IRequestItemModel, RequestItemSchema>('RequestItem', requestItemSchema);

export default RequestItem;
