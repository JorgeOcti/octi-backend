import * as mongoose from 'mongoose';
import { PaginateModel } from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate-v2';
import { IRegion } from '../interfaces';

export interface IRegionModel extends IRegion, mongoose.Document {}
const regionSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: true
  },
  code: {
    type: String,
    trim: true,
    default: ''
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  }
}, {
  timestamps: true
});

regionSchema.plugin(mongoosePaginate);

export type RegionSchema = mongoose.Model<IRegionModel> & PaginateModel<IRegionModel> & {};

const Region = mongoose.model<IRegionModel, RegionSchema>('Region', regionSchema);
export  default Region;
