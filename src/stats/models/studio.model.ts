import * as mongoose from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate-v2';
import { PaginateModel } from 'mongoose';
import {IInvoiceModel} from "../../billing/models/invoice.model";
import {StatsDashboardTypes} from './studio.types'


export const choicesStatsDashboardTypes = [
  StatsDashboardTypes.UNIT_CONTROL,
  StatsDashboardTypes.INVENTORY,
  StatsDashboardTypes.DISTRIBUTION,
  StatsDashboardTypes.PLANIFICATION,
];

const studioSchema = new mongoose.Schema({
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  users: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  type: {
    type: String,
    enum: choicesStatsDashboardTypes,
    default: StatsDashboardTypes.UNIT_CONTROL
  },
  name: String,
  embedURL: String,
},{
  timestamps: true
});

studioSchema.plugin(mongoosePaginate);

export type StudioSchema = mongoose.Model<IInvoiceModel> & PaginateModel<IInvoiceModel>;

const Studio = mongoose.model<IInvoiceModel, StudioSchema>('Studio', studioSchema);

export default Studio;
