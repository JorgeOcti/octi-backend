import * as mongoose from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate';
import {IInvoice} from "../../interfaces/invoice.interface";
import * as mongooseCrate from 'mongoose-crate';
import * as MongooseCrateS3 from 'mongoose-crate-s3';
import * as s3Config from "../../../s3-config.json";
import * as uuid from "uuid";

export interface IInvoiceModel extends IInvoice, mongoose.Document {
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
  inventoryCars: {
    type: Number,
    default: 0
  },
  checklistCars: {
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
  }
},{
   timestamps: true
});

invoiceSchema.plugin(mongooseCrate, {
  storage: new MongooseCrateS3({
    key: process.env.S3_KEY || s3Config.accessKeyId,
    secret: process.env.S3_SECRET || s3Config.secretAccessKey,
    bucket: process.env.S3_BUCKET || s3Config.bucket,
    acl: 'public-read', // defaults to public-read
    region: process.env.S3_REGION || s3Config.region, // defaults to us-standard
    // where the file is stored in the bucket - defaults to this function
    path: (attachment) => {
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

const Invoice = mongoose.model<IInvoiceModel>('Invoice', invoiceSchema);

export default Invoice;
