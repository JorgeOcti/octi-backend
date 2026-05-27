import * as MongooseCrateS3 from 'mongoose-crate-s3';
import * as mongoose from 'mongoose';
import * as mongooseCrate from 'mongoose-crate';

import type { ICodeFile } from '../interfaces/codeFile.interface';

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

export interface ICodeFileModel extends ICodeFile, mongoose.Document {
  attach(condition: string, file: any, error: (err: any) => void): void;
}

export const codeFileSchema = new mongoose.Schema({

  // company: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'Company'
  // },
  // user: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'User'
  // },
  file: fileSchema

}, {
  timestamps: true
});

codeFileSchema.plugin<any>(mongooseCrate, {
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
      return `/codes/files/${attachment.originalname}`;
    }
  }),
  fields: {
    file: {}
  }
});


const CodeFile = mongoose.model<ICodeFileModel>('CodeFile', codeFileSchema);

export default CodeFile;
