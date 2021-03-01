import * as mongoose from 'mongoose';
import { PaginateModel } from 'mongoose';
import * as mongooseCrate from 'mongoose-crate';
import * as MongooseCrateS3 from 'mongoose-crate-s3';
import * as mongoosePaginate from 'mongoose-paginate';
import * as uuid from 'uuid';
import * as s3Config from '../../../s3-config.json';
import {ICompany} from '../../interfaces/company.interface';

export interface ICompanyModel extends ICompany, mongoose.Document {
  attach(fieldName: string, file: any, error?: (err: any) => void): void;
}

const imageSchema = new mongoose.Schema({
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
}, {
  _id: false
});

const billingSchema = new mongoose.Schema({
  checklistPrice: {
    type: Number,
    default: 0
  },
  inventoryPrice: {
    type: Number,
    default: 0
  },
  requestPrice: {
    type: Number,
    default: 0
  },
  active: {
    type: Boolean,
    default: false
  }
}, {
  _id: true
});

const billingNotificationsSchema = new mongoose.Schema({
  name: {
    type: String,
    default: ''
  },
  email: {
    type: String,
    default: ''
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  _id: true
});

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: true
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  deleted: {
    type: Boolean,
    default: false
  },
  billing: {
    type: billingSchema,
    default: {
      active: true,
      checklistPrice: 0.07,
      inventoryPrice: 0.022
    }
  },
  notifications: {
    type: [billingNotificationsSchema],
    default: []
  },
  image: {
    type: imageSchema,
    default: {}
  },
  marker: {
    type: imageSchema,
    default: {}
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});
// {billing:{ active: true, checklistPrice: 0.07 , inventoryPrice: 0.022}, notifications:[]}

companySchema.plugin(mongoosePaginate);

companySchema.plugin(mongooseCrate, {
  storage: new MongooseCrateS3({
    key: process.env.S3_KEY || s3Config.accessKeyId,
    secret: process.env.S3_SECRET || s3Config.secretAccessKey,
    bucket: process.env.S3_BUCKET || s3Config.bucket,
    acl: 'public-read', // defaults to public-read
    region: process.env.S3_REGION || s3Config.region, // defaults to us-standard
    // where the file is stored in the bucket - defaults to this function
    path: (attachment: any) => {
      /* attachment params:
      estination:"/tmp/"
      encoding:"7bit"s
      fieldname:"file"
      filename:"158df9426e29a5a057526c2cbf74397d"
      mimetype:"image/svg+xml"
      name:"158df9426e29a5a057526c2cbf74397d"
      originalname:"aws-codedeploy.svg"
      path:"/tmp/158df9426e29a5a057526c2cbf74397d"
      size:966
      type:"image/svg"
      * */
      return `/company/files/${attachment.team}/${uuid.v1()}-${attachment.originalname}`;
    }
  }),
  fields: {
    image: {},
    marker: {}
  }
});

companySchema.virtual('users', {
  ref: 'User', // The model to use
  localField: '_id', // Find field in this model
  foreignField: 'company', // is equal to field in another model
  justOne: false
});

export type CompanySchema = mongoose.Model<ICompanyModel> & PaginateModel<ICompanyModel>;

const Company = mongoose.model<ICompanyModel, CompanySchema>('Company', companySchema);

export default Company;
