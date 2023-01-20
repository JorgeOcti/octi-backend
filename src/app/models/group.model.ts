import * as mongoose from 'mongoose';
import type { IGroup } from '../interfaces/group.interface';

export interface IGroupModel extends IGroup, mongoose.Document {}

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    unique: true
  },
  description: {
    type: String
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: [true]
  },
  companies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
  }],
  venues: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Form'
  }],
  modules: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module',
  }],
  permissions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Permission'
  }],
  forms: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Form'
  }],
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const Group = mongoose.model<IGroupModel>('Group', groupSchema);

export default Group;
