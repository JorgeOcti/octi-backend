import * as mongoose from 'mongoose';

import type { IAlert } from '../interfaces/alert.interface';

export interface IAlertModel extends IAlert, mongoose.Document<any> {}

const alertSchema = new mongoose.Schema({
  name: {
    type: String
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  gte: {
    type: Number,
    default: 0
  },
  lte: {
    type: Number,
    default: 0
  },
  users: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

const Alert = mongoose.model<IAlertModel>('Alert', alertSchema);

export default Alert;
