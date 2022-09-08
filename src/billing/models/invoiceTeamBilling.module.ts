import * as mongoose from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate-v2';
import {IInvoiceTeamBilling} from '../interfaces/invoiceTeamBilling.interface';
import * as mongooseCrate from 'mongoose-crate';
import * as MongooseCrateS3 from 'mongoose-crate-s3';
import * as s3Config from '../../../s3-config.json';
import * as uuid from 'uuid';
import { PaginateModel } from 'mongoose';
import {teamBillingSchema} from "./teamBilling.model";

export interface IInvoiceTeamBillingModel extends IInvoiceTeamBilling, mongoose.Document {
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
  file: {
    type: fileSchema,
    default: {}
  }
},{
   timestamps: true
});

invoiceTeamBillingSchema.plugin(mongooseCrate, {
  storage: new MongooseCrateS3({
    key: process.env.S3_KEY || s3Config.accessKeyId,
    secret: process.env.S3_SECRET || s3Config.secretAccessKey,
    bucket: process.env.S3_BUCKET || s3Config.bucket,
    acl: 'public-read', // defaults to public-read
    region: process.env.S3_REGION || s3Config.region, // defaults to us-standard
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
