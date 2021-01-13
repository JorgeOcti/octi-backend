import { boolean } from 'joi';
import * as mongoose from 'mongoose';
import { PaginateModel } from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate';
import { IReason } from '../../interfaces/reason.interface';

export interface IReasonModel extends IReason, mongoose.Document {}

const fileSchema = new mongoose.Schema({
  active: {
    type: Boolean
  },
  required: {
    type: Boolean
  }
});

const reasonSchema = new mongoose.Schema({
  name: {
    type: String
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  file: fileSchema
});

reasonSchema.plugin(mongoosePaginate);

export type ReasonSchema = mongoose.Model<IReasonModel> & PaginateModel<IReasonModel>;

const Reason = mongoose.model<IReasonModel, ReasonSchema>('Reason', reasonSchema);

export default Reason;

