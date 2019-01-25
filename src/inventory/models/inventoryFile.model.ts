import * as mongoose from 'mongoose';
import * as mongooseCrate from 'mongoose-crate';
import * as MongooseCrateS3 from 'mongoose-crate-s3';
import * as uuid from 'uuid';
import * as s3Config from '../../../s3-config.json';
import {IInventoryFile} from '../../interfaces/inventoryFile.interface';

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

export interface IInventoryFileModel extends IInventoryFile, mongoose.Document {
  attach(fieldName: string, file: any, error?: (err: any) => void): void;
}

export const inventoryFileSchema = new mongoose.Schema({
  inventory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Inventory'
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  },

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  file: fileSchema,
  thumbnail: fileSchema

}, {
  timestamps: true
});

inventoryFileSchema.plugin(mongooseCrate, {
  storage: new MongooseCrateS3({
    key: s3Config.accessKeyId,
    secret: s3Config.secretAccessKey,
    bucket: s3Config.bucket,
    acl: 'public-read', // defaults to public-read
    region: s3Config.region, // defaults to us-standard
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
      return `/inventories/files/${attachment.team}/${attachment.inventory}/${attachment.venue}/${uuid.v1()}-${attachment.originalname}`;
    }
  }),
  fields: {
    file: {},
    thumbnail: {}
  }
});

// inventoryFileSchema.index({ form: 1, user: 1 });

const InventoryFile = mongoose.model<IInventoryFileModel>('InventoryFile', inventoryFileSchema);

export default InventoryFile;
