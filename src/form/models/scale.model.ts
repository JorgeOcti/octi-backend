import * as mongoose from 'mongoose';
import {IChoices, IScale} from '../interfaces/scale.interface';

export interface IChoicesModel extends IChoices, mongoose.Types.Subdocument {}
export const choiceBackgroundColors = ['red', 'green', 'yellow', 'blue'];

const choiceSchema = new mongoose.Schema({
  choice: {type: String, required: true, trim: true},
  value: {type: Number, required: true},
  backgroundColor: {
    type: String,
    enum: choiceBackgroundColors,
    default: 'blue'
  },
  requireImage: {type: Boolean, default: false},
  requireComment: {type: Boolean, default: false},
  requireAccesories: {type: Boolean, default: false},
  requireConciliation: {type: Boolean, default: false},
  na: {type: Boolean, default: false},
  order: {type: Number, required: true}
});

export interface IScaleModel extends IScale, mongoose.Document {}
export const scaleSchema = new mongoose.Schema({
  name: String,
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    require: true
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    require: true
  },
  minValue: {
    type: Number,
    required: true
  },
  maxValue: {
    type: Number,
    required: true
  },
  choices: [choiceSchema],
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const Scale = mongoose.model<IScaleModel>('Scale', scaleSchema);

export default Scale;
