import * as mongoose from 'mongoose';
import { AggregatePaginateModel, PaginateModel } from 'mongoose';
import * as mongooseCrate from 'mongoose-crate';
import * as MongooseCrateS3 from 'mongoose-crate-s3';
import * as mongoosePaginate from 'mongoose-paginate-v2';
import * as uuid from 'uuid';
import type { IRequest } from '../interfaces/request.interface';
import mongooseAggregatePaginate = require('mongoose-aggregate-paginate-v2');

export interface IRequestModel extends IRequest, mongoose.Document<any> {
}

const metaSchema = new mongoose.Schema({

});

const customerInformationSchema = new mongoose.Schema({
  name: {
    type: String
  },
  rut: {
    type: String
  },
  email: {
    type: String
  },
  phone: {
    type: String
  }
});

const paymentInformationSchema = new mongoose.Schema({
  method: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PaymentMethod'
  },
  otherMethod: {
    type: String
  },
  number: {
    type: String
  },
  files: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RequestFile'
  }],
  letters: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RequestFile'
  }]
});

export const requestSchema = new mongoose.Schema({
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'company'
  },
  meta: {
    type: metaSchema,
    default: {}
  },
  number: {
    type: Number
  },
  customerInformation: {
    type: customerInformationSchema,
    default: {}
  },
  advancePaymentInformation: {
    type: paymentInformationSchema,
    default: {}
  },
  conectaID: {
    type: String
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
  deliveryVenue: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Venue'
  },
  deliveryAddress: {
    type: String
  },
  deliveryDate: {
    type: Date
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

requestSchema.set<any>('redisCache', process.env.ENV === 'production');
requestSchema.set<any>('expires', 30);

requestSchema.index({ team: 1, conectaID: 1 });

requestSchema.virtual('items', {
  ref: 'RequestItem', // The model to use
  localField: '_id', // Find field in this model
  foreignField: 'request', // is equal to field in another model
  justOne: false
});

requestSchema.set('toObject', { virtuals: true });
requestSchema.set('toJSON', { virtuals: true });

requestSchema.plugin(mongoosePaginate);
requestSchema.plugin(mongooseAggregatePaginate);

requestSchema.plugin<any>(mongooseCrate, {
  storage: new MongooseCrateS3({
    key: process.env.AWS_ACCESS_KEY_ID as string,
    secret: process.env.AWS_SECRET_ACCESS_KEY as string,
    bucket: process.env.S3_BUCKET as string,
    acl: 'bucket-owner-full-control', // defaults to public-read
    region: (process.env.S3_REGION || process.env.AWS_REGION) as string, // defaults to us-standard
    // where the file is stored in the bucket - defaults to this function
    path: (attachment: any) => {
      return `/request/files/${attachment.team}/${uuid.v1()}-${attachment.originalname}`;
    }
  }),
  fields: {
    paymentInformationSchema: {
      advancePaymentFile: {}
    }
  }
});

requestSchema.post<IRequestModel>("update", async (doc) => {
  console.log('******************* REQUET update ********************');
  // console.log(doc);
});

requestSchema.post<IRequestModel>("findOneAndUpdate", function (doc) {
  console.log('******************** REQUET findOneAndUpdate *******************');
  // console.log(doc);
});

export type RequestSchema = mongoose.Model<IRequestModel> & PaginateModel<IRequestModel> & AggregatePaginateModel<IRequestModel>;

const Request = mongoose.model<IRequestModel, RequestSchema>('Request', requestSchema);

export default Request;

