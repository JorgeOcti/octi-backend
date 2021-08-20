import * as mongoose from 'mongoose';
import {AggregatePaginateModel, PaginateModel} from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate';
import {IMilestone} from '../interfaces/milestone.interface';
import mongooseAggregatePaginate = require('mongoose-aggregate-paginate-v2');

export interface IMilestoneModel extends IMilestone, mongoose.Document {}

export enum ChoicesKindMilestone {
  form = 'form',
  file = 'file',
}

export const choicesKindMilestone = [
  ChoicesKindMilestone.form,
  ChoicesKindMilestone.file
];

export enum ChoicesStepMilestone {
  checkItem = 'checkItem',
  loadEvidence = 'loadEvidence',
  finishTransmittal = 'finishTransmittal',
}

export const choicesStepMilestone = [
  ChoicesStepMilestone.checkItem,
  ChoicesStepMilestone.loadEvidence,
  ChoicesStepMilestone.finishTransmittal
];

const milestoneSchema = new mongoose.Schema({
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  name: {
    type: String
  },
  kind: {
    type: String,
    enum: choicesKindMilestone,
    default: ""
  },
  step: {
    type: String,
    enum: choicesStepMilestone,
    default: ""
  },
  form: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Form'
  },
  order: {
    type: Number
  }
}, {
  timestamps: true
});

milestoneSchema.plugin(mongoosePaginate);
milestoneSchema.plugin(mongooseAggregatePaginate);

export type MilestoneSchema =
  mongoose.Model<IMilestoneModel>
  & PaginateModel<IMilestoneModel>
  & AggregatePaginateModel<IMilestoneModel>;

const Milestone = mongoose.model<IMilestoneModel, MilestoneSchema>('Milestone', milestoneSchema);

export default Milestone;
