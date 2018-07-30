import * as mongoose from 'mongoose';
import {IAlert} from '../../interfaces/alert.interface';

export interface IAlertModel extends IAlert, mongoose.Document {}

const alertSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
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
