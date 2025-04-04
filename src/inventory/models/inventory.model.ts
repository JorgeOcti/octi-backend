import * as MongooseCrateS3 from 'mongoose-crate-s3';
import * as mongoose from 'mongoose';
import * as mongooseCrate from 'mongoose-crate';
import * as mongoosePaginate from 'mongoose-paginate-v2';
import * as s3Config from '../../../s3-config.json';
import * as uuid from 'uuid';
import type { IInventory } from '../interfaces/inventory.interface';
import { PaginateModel } from 'mongoose';

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

const photoSettingSchema = new mongoose.Schema({
  manual: {
    type: Number,
    default: 1
  },
  report: {
    type: Number,
    default: 1
  }
}, {
  _id: false
});

const settingSchema = new mongoose.Schema({
  photos: {
    type: photoSettingSchema
  },
}, {
  _id: false
});

export interface IInventoryModel extends IInventory, mongoose.Document {
  attach(fieldName: string, file: any, error?: (err: any) => void): void;
}

export enum ChoicesStatusInventory {
  pending = 'pending',
  inProcess = 'inProcess',
  finalized = 'finalized'
}

export const choicesStatusInventory = [
  ChoicesStatusInventory.pending,
  ChoicesStatusInventory.inProcess,
  ChoicesStatusInventory.finalized
];

const inventorySchema = new mongoose.Schema({
  name: {
    type: String
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  venues: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Venue'
  }],
  file: {
    type: fileSchema,
    default: {}
  },
  settings: {
    type: settingSchema,
    default: {
      photos: {
        manual: 1,
        report: 1
      }
    }
  },
  backup: {
    type: fileSchema,
    default: {}
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  finalizedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  finalizedAt: {
    type: Date
  },
  status: {
    type: String,
    enum: choicesStatusInventory,
    default: ChoicesStatusInventory.pending
  },
  containerInventory: {
    type: Boolean
  },
  virtual: {
    type: Boolean,
    default: false
  },
  virtualInventories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VirtualInventory'
  }],
  unitForm: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Form',
    required: false
  }
}, {
  timestamps: true
});

inventorySchema.set('toObject', { virtuals: true });
inventorySchema.set('toJSON', { virtuals: true });

inventorySchema.index({ team: 1 });
inventorySchema.index({ users: 1 });
inventorySchema.index({ createdBy: 1 });
inventorySchema.index({ finalizedBy: 1 });
inventorySchema.index({ team: 1, status: 1, venues: 1 });

inventorySchema.set<any>('redisCache', process.env.ENV === 'production');
inventorySchema.set<any>('expires', 10);

inventorySchema.plugin<any>(mongooseCrate, {
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
      return `/inventories/setting/${attachment.team}/${uuid.v1()}-${attachment.originalname}`;
    }
  }),
  fields: {
    file: {},
    backup: {}
  }
});

inventorySchema.virtual('cars', {
  ref: 'InventoryCar', // The model to use
  localField: '_id', // Find field in this model
  foreignField: 'inventory', // is equal to field in another model
  justOne: false
});

inventorySchema.plugin(mongoosePaginate);

export type InventorySchema = mongoose.Model<IInventoryModel> & PaginateModel<IInventoryModel>;

const Inventory = mongoose.model<IInventoryModel, InventorySchema>('Inventory', inventorySchema);

export default Inventory;
