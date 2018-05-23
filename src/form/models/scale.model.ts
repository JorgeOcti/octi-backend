import * as mongoose from 'mongoose';

export interface IChoicesModel extends mongoose.Types.Subdocument {
  choice: string;
  value: number;
  requireImage: boolean;
  requireComment: boolean;
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
  choice: { type: String, required: true, trim: true },
  value: { type: Number, required: true },
  requireImage: {type: Boolean, default: false},
  requireComment: {type: Boolean, default: false},
  na: {type: Boolean, default: false},
  order: { type: Number, required: true }
});
// }, {_id: false});

export const scaleSchema = new mongoose.Schema({
  name: String,
  minValue: { type: Number, required: true },
  maxValue: { type: Number, required: true },
  choices: [choiceSchema],
  active: {type: Boolean, default: true}
}, {
  timestamps: true
});

const Scale = mongoose.model<IScaleModel>('Scale', scaleSchema);

export default Scale;
