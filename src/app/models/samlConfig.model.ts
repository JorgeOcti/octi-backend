import * as MongooseCrateS3 from 'mongoose-crate-s3';
import * as mongoose from 'mongoose';
import * as mongooseCrate from 'mongoose-crate';
import * as mongoosePaginate from 'mongoose-paginate-v2';
import * as uuid from 'uuid';

import type { ISamlConfig } from '../interfaces/samlConfig.interface';
import { PaginateModel } from 'mongoose';

export interface ISamlConfigModel extends ISamlConfig, mongoose.Document {
  attach(fieldName: string, file: any, error?: (err: any) => void): void;
}

const certSchema = new mongoose.Schema({
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

const samlConfigSchema = new mongoose.Schema({
  // name of the provider to identify it
  name: {
    type: String,
    required: true
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  // is the URL provided by Identity Provider which will be used to redirect users on the login page if not authenticated.
  entryPoint: {
    type: String,
    trim: true
  },
  // is a string provided to the Identity Provider to uniquely identify Service Provider.
  issuer: {
    type: String,
  },
  // This will be the URL of the Service Provider which will consume the SAML response once authentication is done on Identity Provider. Identity Provider will call this URL.
  callbackUrl: {
    type: String,
    trim: true
  },
  // This is the certificate provided by Identity Provider. This will be used to establish the trust between Identity Provider and Service Provider.
  cert: {
    type: certSchema,
    default: {}
  },
  // SAML Custom Connector (Advanced) Field
}, {
  timestamps: true
});

samlConfigSchema.plugin(mongoosePaginate);

samlConfigSchema.plugin<any>(mongooseCrate, {
  storage: new MongooseCrateS3({
    key: process.env.AWS_ACCESS_KEY_ID as string,
    secret: process.env.AWS_SECRET_ACCESS_KEY as string,
    bucket: process.env.S3_BUCKET as string,
    acl: 'bucket-owner-full-control', // defaults to public-read
    region: (process.env.S3_REGION || process.env.AWS_REGION) as string, // defaults to us-standard
    // where the file is stored in the bucket - defaults to this function
    path: (attachment: any) => {
      return `/saml/cert/${attachment.team}/${uuid.v1()}-${attachment.originalname}`;
    }
  }),
  fields: {
    cert: {},
  }
});


export type SamlConfigSchema = mongoose.Model<ISamlConfigModel> & PaginateModel<ISamlConfigModel>;

const SamlConfig = mongoose.model<ISamlConfigModel, SamlConfigSchema>('SamlConfig', samlConfigSchema);

export default SamlConfig;
