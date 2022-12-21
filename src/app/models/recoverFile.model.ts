import * as MongooseCrateS3 from 'mongoose-crate-s3';
import * as mongoose from 'mongoose';
import * as mongooseCrate from 'mongoose-crate';
import * as s3Config from '../../../s3-config.json';

import { IRecoverFile } from '../interfaces';

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

export interface IRecoverFileModel extends IRecoverFile, mongoose.Document {
  attach(condition: string, file: any, error: (err: any) => void): void;
}

export const recoverFileSchema = new mongoose.Schema({
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  },

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  file: fileSchema

}, {
  timestamps: true
});

recoverFileSchema.plugin<any>(mongooseCrate, {
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
      return `/forms/files/${attachment.company}/recover/${attachment.user}/${attachment.originalname}`;
    }
  }),
  fields: {
    file: {}
  }
});


const RecoverFile = mongoose.model<IRecoverFileModel>('RecoverFile', recoverFileSchema);

export default RecoverFile;
