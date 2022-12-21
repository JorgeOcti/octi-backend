import * as mongoose from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate-v2';

import { modulesHistory, statusHistory } from './history.types';

import { IHistory } from '../interfaces';
import { PaginateModel } from 'mongoose';

export interface IHistoryModel extends IHistory, mongoose.Document<any> {
}

const historyAlertsSchema = new mongoose.Schema({
  hasDamages: {
    type: Boolean
  }
}, {
  _id: false
});


const historySchema = new mongoose.Schema({
  from: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Venue'
  },
  to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Venue'
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
  car: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Car',
    required: true
  },
  status: {
    type: String,
    enum: statusHistory,
    required: true
  },
  module: {
    type: String,
    enum: modulesHistory,
    required: true
  },
  form: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Form'
  },
  participant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Participant'
  },
  inventory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Inventory'
  },
  inventoryCar: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InventoryCar'
  },
  changeLocation: {
    type: Boolean,
    required: true,
    default: false
  },
  current: {
    type: Boolean,
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  alert: {
    type: historyAlertsSchema,
    default: {}
  },
  alerts: {
    type: [historyAlertsSchema],
    default: []
  },
  executedAt: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

historySchema.index({ team: 1, car: 1 });
historySchema.index({ createdBy: 1 });
historySchema.index({ company: 1, status: 1, current: 1, createdAt: 1 });
historySchema.index({ company: 1, executedAt: 1 });
historySchema.index({ executedAt: 1 });
historySchema.index({ car: 1 });
historySchema.index({ from: 1 });
historySchema.index({ to: 1 });
// historySchema.index({ firstName: 1, lastName: 1}, { unique: true });
historySchema.index({ team: 1, company: 1, car: 1 });
historySchema.index({ team: 1, current: 1, car: 1 });
historySchema.index({ team: 1, company: 1, current: 1, car: 1 });

historySchema.plugin(mongoosePaginate);

export type HistorySchema = mongoose.Model<IHistoryModel> & PaginateModel<IHistoryModel> & {};

const History = mongoose.model<IHistoryModel, HistorySchema>('History', historySchema);
export default History;
