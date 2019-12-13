import * as mongoose from "mongoose";
import {PaginateModel} from "mongoose";
import {IReason} from "../../interfaces/reason.interface";
import * as mongoosePaginate from "mongoose-paginate";

export interface IReasonModel extends IReason, mongoose.Document {}

const reasonSchema = new mongoose.Schema({
  name: {
    type: String
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  }
});

reasonSchema.plugin(mongoosePaginate);

export type ReasonSchema = mongoose.Model<IReasonModel> & PaginateModel<IReasonModel>;

const Reason = mongoose.model<IReasonModel, ReasonSchema>('Reason', reasonSchema);

export default Reason;

