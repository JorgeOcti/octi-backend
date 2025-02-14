import * as mongoose from 'mongoose';
import { PaginateModel } from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate-v2';
import type { IVersion } from '../interfaces/version.interface';

export interface IVersionModel extends IVersion, mongoose.Document {}

const appVersionSchema = new mongoose.Schema({
  description: String,
  ios: String,
  android: String
}, {
  _id: false
});

const versionSchema = new mongoose.Schema(
  {
    name: {
      type: String
    },
    description: {
      type: String
    },
    android: {
      type: String
    },
    ios: {
      type: String
    },
    docks: appVersionSchema,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

versionSchema.plugin(mongoosePaginate);

export type VersionSchema = mongoose.Model<IVersionModel> &
  PaginateModel<IVersionModel>;

const Version = mongoose.model<IVersionModel, VersionSchema>(
  'Version',
  versionSchema
);

export default Version;
