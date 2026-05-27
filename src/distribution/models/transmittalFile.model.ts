import * as MongooseCrateS3 from 'mongoose-crate-s3';
import * as mongoose from 'mongoose';
import * as mongooseCrate from 'mongoose-crate';
import * as uuid from 'uuid';

import {ITransmittalFile} from '../interfaces/transmittalFile.interface';

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
},{
  _id: false,
});

export interface ITransmittalllFileModel extends ITransmittalFile, mongoose.Document<any> {
  attach(fieldName: string, file: any, error?: (err: any) => void): void;
}

export const transmittalFileSchema = new mongoose.Schema({
  transmittal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Inventory'
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  file: fileSchema,
  thumbnail: fileSchema,
  milestone: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Milestone'
  },

}, {
  timestamps: true
});

transmittalFileSchema.plugin<any>(mongooseCrate, {
  storage: new MongooseCrateS3({
    key: process.env.AWS_ACCESS_KEY_ID as string,
    secret: process.env.AWS_SECRET_ACCESS_KEY as string,
    bucket: process.env.S3_BUCKET as string,
    acl: 'public-read', // defaults to public-read
    region: (process.env.S3_REGION || process.env.AWS_REGION) as string, // defaults to us-standard
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
      return `/transmittal/files/${attachment.team}/${uuid.v1()}-${attachment.originalname}`;
    }
  }),
  fields: {
    file: {},
    thumbnail: {}
  }
});

// transmittalFileSchema.index({ form: 1, user: 1 });

const TransmittalFile = mongoose.model<ITransmittalllFileModel>('TransmittalFile', transmittalFileSchema);

export default TransmittalFile;
