import * as mongoose from "mongoose";
import {PaginateModel} from "mongoose";
import {IRequestStatus} from "../../interfaces/requestStatus.interface";

export interface IRequestStatusModel extends IRequestStatus, mongoose.Document {}

const requestStatusSchema = new mongoose.Schema({
  name: {
    type: String
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  }
});

export type RequestStatusSchema = mongoose.Model<IRequestStatusModel> & PaginateModel<IRequestStatusModel>;

const RequestStatus = mongoose.model<IRequestStatusModel, RequestStatusSchema>('RequestStatus', requestStatusSchema);

export default RequestStatus;

