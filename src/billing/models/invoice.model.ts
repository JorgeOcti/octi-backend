import * as mongoose from 'mongoose';
import * as mongooseCrate from 'mongoose-crate';
import * as MongooseCrateS3 from 'mongoose-crate-s3';
import * as mongoosePaginate from 'mongoose-paginate-v2';
import * as uuid from 'uuid';

import { PaginateModel } from 'mongoose';
import type { IInvoice } from '../interfaces/invoice.interface';

export interface IInvoiceModel extends IInvoice, mongoose.Document<any> {
  attach(condition: string, file: any, error: (err: any) => void): void;
}

const fileSchema = new mongoose.Schema({
  url: {
    type: String
  },
  type: {
    type: String
  },
  name: {
    type: String
  },
  size: {
    type: Number
  }
});

const invoiceSchema = new mongoose.Schema({
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  },
  period: {
    type: String
  },
  inventoryCars: {
    type: Number,
    default: 0
  },
  checklistCars: {
    type: Number,
    default: 0
  },
  containers: {
    type: Number,
    default: 0
  },
  containersPrice: {
    type: Number,
    default: 0
  },
  deliveryCars: {
    type: Number,
    default: 0
  },
  requestCars: {
    type: Number,
    default: 0
  },
  inventoryPrice: {
    type: Number,
    default: 0
  },
  checklistPrice: {
    type: Number,
    default: 0
  },
  deliveryPrice: {
    type: Number,
    default: 0
  },
  requestPrice: {
    type: Number,
    default: 0
  },
  totalUF: {
    type: Number,
    default: 0
  },
  totalDolar: {
    type: Number,
    default: 0
  },
  totalPeso: {
    type: Number,
    default: 0
  },
  valueUF: {
    type: Number,
    default: 0
  },
  valueDolar: {
    type: Number,
    default: 0
  },
  file: {
    type: fileSchema,
    default: {}
  },
  detail: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

invoiceSchema.plugin<any>(mongooseCrate, {
  storage: new MongooseCrateS3({
    key: process.env.AWS_ACCESS_KEY_ID as string,
    secret: process.env.AWS_SECRET_ACCESS_KEY as string,
    bucket: process.env.S3_BUCKET as string,
    acl: 'bucket-owner-full-control', // defaults to public-read
    region: (process.env.S3_REGION || process.env.AWS_REGION) as string, // defaults to us-standard
    // where the file is stored in the bucket - defaults to this function
    path: (attachment: any) => {
      /* attachment params:
      destination:"/tmp/"
      encoding:"7bit"
      fieldname:"file"
      filename:"158df9426e29a5a057526c2cbf74397d"
      mimetype:"image/svg+xml"
      name:"158df9426e29a5a057526c2cbf74397d"
      originalname:"aws-codedeploy.svg"
      path:"/tmp/158df9426e29a5a057526c2cbf74397d"
      size:966
      type:"image/svg"
      * */

      return `/invoices/${attachment.team}/${attachment.createdAt}/${attachment.company}/${uuid.v1()}-${attachment.originalname}`;
      // console.log('invoice-attachment', attachment);
      // return `/invoices/${uuid.v1()}-${attachment.originalname}`;
    }
  }),
  fields: {
    file: {}
  }
});

invoiceSchema.plugin(mongoosePaginate);

export type InvoiceSchema = mongoose.Model<IInvoiceModel> & PaginateModel<IInvoiceModel>;

const Invoice = mongoose.model<IInvoiceModel, InvoiceSchema>('Invoice', invoiceSchema);

export default Invoice;
