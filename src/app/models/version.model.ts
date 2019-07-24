import * as mongoose from 'mongoose';
import { IVersion } from '../../interfaces/version.interface';

export interface IVersionModel extends IVersion, mongoose.Document {}

const versionSchema = new mongoose.Schema({
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
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
}, {
  timestamps: true
});

const Version = mongoose.model<IVersionModel>('Version', versionSchema);

export default Version;
