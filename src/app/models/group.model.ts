import * as mongoose from 'mongoose';
import {IGroup} from '../interfaces/group.interface';

export interface IGroupModel extends IGroup, mongoose.Document {}

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    unique: true
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: [true, 'La empresa es requerida'],
    index: true
  },
  permissions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Permission'
  }],
  forms: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Form'
  }]
}, {
  timestamps: true
});

const Group = mongoose.model<IGroupModel>('Group', groupSchema);

export default Group;
