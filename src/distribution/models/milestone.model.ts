import * as mongoose from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate-v2';

import { AggregatePaginateModel, PaginateModel } from 'mongoose';

import { IMilestone } from '../interfaces/milestone.interface';

import mongooseAggregatePaginate = require('mongoose-aggregate-paginate-v2');

export interface IMilestoneModel extends IMilestone, mongoose.Document<any> {}

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

const updateItemsSchema = new mongoose.Schema({
  arrivalDate: {
    type: Boolean
  }
},{
  _id: false,
});

const milestoneSchema = new mongoose.Schema({
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  type: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MilestoneType'
  },
  name: {
    type: String
  },
  description: {
    type: String
  },
  hint: {
    type: String
  },
  kind: {
    type: String,
    enum: choicesKindMilestone,
    default: ''
  },
  step: {
    type: String,
    enum: choicesStepMilestone,
    default: ''
  },
  form: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Form'
  },
  requestItemStatus: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RequestItemStatus'
  },
  updateItems:{
    type: updateItemsSchema,
    default: {}
  },
  order: {
    type: Number
  }
}, {
  timestamps: true
});

milestoneSchema.statics.findOneOrCreate = function(condition: any, create: any): Promise<IMilestoneModel> {
  const model = this;
  return new Promise((resolve, reject) => {
    model.findOne(condition, (err: any, result: IMilestoneModel) => {
      if (err) {
        return reject(err);
      }
      if (result) {
        return resolve(result);
      }
      model.create(create, (err: any, result: IMilestoneModel) => {
        if (err) {
          return reject(err);
        }
        return resolve(result);
      });
    });
  });
};

milestoneSchema.index({ 'team': 1 });

milestoneSchema.plugin(mongoosePaginate);
milestoneSchema.plugin(mongooseAggregatePaginate);

export type MilestoneSchema = mongoose.Model<IMilestoneModel>
  & PaginateModel<IMilestoneModel> & AggregatePaginateModel<IMilestoneModel> & {
  findOneOrCreate(condition: any, create: any): Promise<IMilestoneModel>
};

const Milestone = mongoose.model<IMilestoneModel, MilestoneSchema>('Milestone', milestoneSchema);

export default Milestone;
