import {  ObjectId } from 'bson';
import * as mongoose from 'mongoose';
import {IActivityHistoryInterface} from '../../interfaces/activityHistory.interface';

const detailInventorySchema = new mongoose.Schema({
  name: {
    type: String
  }
});

const detailFormSchema = new mongoose.Schema({
  name: {
    type: String
  }
});

const detailCarSchema = new mongoose.Schema({
  vin: {
    type: String
  }
});

const responseCarSchema = new mongoose.Schema({
  item: {
    type: ObjectId
  },
  number: {
    type: Number
  }
});

export interface IActivityHistorygModel extends IActivityHistoryInterface, mongoose.Document {}

export enum ChoicesTypeActivity {
  inventory = 'inventory',
  checklist = 'checklist',
  request = 'request'
}

export const choicesTypeActivity = [
  ChoicesTypeActivity.inventory,
  ChoicesTypeActivity.checklist,
  ChoicesTypeActivity.request
];

const activityHistorySchema = new mongoose.Schema({
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  type: {
    type: String,
    enum: choicesTypeActivity
  },
  inventory: {
    type: detailInventorySchema,
    default: {}
  },
  form: {
    type: detailFormSchema,
    default: {}
  },
  car: {
    type: detailCarSchema,
    default: {}
  },
  request: {
    type: responseCarSchema,
    default: {}
  }
}, {
  timestamps: true
});

const ActivityHistory = mongoose.model<IActivityHistorygModel>('ActivityHistory', activityHistorySchema);

export default ActivityHistory;
