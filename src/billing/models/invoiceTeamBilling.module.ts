import * as mongoose from 'mongoose';
import * as mongooseCrate from 'mongoose-crate';
import * as MongooseCrateS3 from 'mongoose-crate-s3';
import * as mongoosePaginate from 'mongoose-paginate-v2';
import * as uuid from 'uuid';

import { PaginateModel } from 'mongoose';
import type { IInvoiceTeamBilling } from '../interfaces/invoiceTeamBilling.interface';
import { teamBillingSchema } from "./teamBilling.model";

export interface IInvoiceTeamBillingModel extends IInvoiceTeamBilling, mongoose.Document<any> {
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

const subModulesSchema = new mongoose.Schema({
  subModule: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Submodule'
  },
  histories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'History'
  }]
});

const modulesSchema = new mongoose.Schema({
  module: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module'
  },
  histories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'History'
  }]
});

const companiesSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  },
  histories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'History'
  }]
});

const invoiceTeamBillingSchema = new mongoose.Schema({
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  period: {
    type: String
  },
  teamBilling: {
    type: teamBillingSchema,
  },

  modules: [{
    type: modulesSchema,
  }],
  subModules: [{
    type: subModulesSchema,
  }],
  companies: [{
    type: companiesSchema,
  }],

  histories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'History'
  }],

  uniqueHistories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'History'
  }],

  realDolar: {
    type: Number,
    default: 0
  },
  totalDolar: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    default: 0
  },
  totalUF: {
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
  from: {
    type: Date
  },
  to: {
    type: Date,
  },
  file: {
    type: fileSchema,
    default: {}
  }
}, {
  timestamps: true
});

invoiceTeamBillingSchema.plugin<any>(mongooseCrate, {
  storage: new MongooseCrateS3({
    key: process.env.AWS_ACCESS_KEY_ID as string,
    secret: process.env.AWS_SECRET_ACCESS_KEY as string,
    bucket: process.env.S3_BUCKET as string,
    acl: 'public-read', // defaults to public-read
    region: (process.env.S3_REGION || process.env.AWS_REGION) as string, // defaults to us-standard
    // where the file is stored in the bucket - defaults to this function
    path: (attachment: any) => {
      return `/invoices-team-billing/${attachment.team}/${attachment.createdAt}/${uuid.v1()}-${attachment.originalname}`;
    }
  }),
  fields: {
    file: {}
  }
});

invoiceTeamBillingSchema.plugin(mongoosePaginate);

export type InvoiceSchema = mongoose.Model<IInvoiceTeamBillingModel> & PaginateModel<IInvoiceTeamBillingModel>;

const InvoiceTeamBilling = mongoose.model<IInvoiceTeamBillingModel, InvoiceSchema>('InvoiceTeamBilling', invoiceTeamBillingSchema);

export default InvoiceTeamBilling;
