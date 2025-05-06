import * as mongoose from 'mongoose';
import { IDraft } from '../interfaces/draft.interface';
import { PaginateModel } from 'mongoose';

export interface IDraftModel extends IDraft, mongoose.Document {}

const draftSchema = new mongoose.Schema({
  car: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Car'
  },
  venue: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Venue'
  },
  form: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Form'
  },
  keys: {
    type: [String],
    default: []
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  answers : {
    type: Object,
    default: {},
  }
},{
  timestamps: true
});

export type DraftSchema = mongoose.Model<IDraftModel> &
  PaginateModel<IDraftModel> &
  mongoose.AggregatePaginateModel<IDraftModel>;

const Draft = mongoose.model<IDraftModel, DraftSchema>('Draft', draftSchema);

export default Draft;
