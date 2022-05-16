import * as mongoose from 'mongoose';
import { PaginateModel } from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate';
import { IHistory } from '../interfaces';
import { statusHistory, modulesHistory } from './history.types';

export interface IHistoryModel extends IHistory, mongoose.Document {
}

const historySchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: true
  },
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
  participant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Participant'
  },
  inventory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Inventory'
  },
  inventoryDetail: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InventoryCar'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

historySchema.plugin(mongoosePaginate);

export type HistorySchema = mongoose.Model<IHistoryModel> & PaginateModel<IHistoryModel> & {};

const History = mongoose.model<IHistoryModel, HistorySchema>('History', historySchema);
export default History;
