import * as mongoose from 'mongoose';

export interface IChoicesModel extends mongoose.Types.Subdocument {
  choice: string;
  value: number;
  requireImage: boolean;
  requireText: boolean;
  order: number;
}

export interface IScaleModel extends mongoose.Document {
  name: string;
  minValue: number;
  maxValue: number;
  choices: mongoose.Types.Array<IChoicesModel>;
  active: boolean;
}

const choiceSchema = new mongoose.Schema({
  choice: String,
  value: Number,
  requireImage: Boolean,
  requireText: Boolean,
  order: Number
}, {_id: false});

export const scaleSchema = new mongoose.Schema({
  name: String,
  minValue: Number,
  maxValue: Number,
  choices: [choiceSchema],
  active: Boolean
}, {
  timestamps: true
});

const Scale = mongoose.model<IScaleModel>('Scale', scaleSchema);

export default Scale;
