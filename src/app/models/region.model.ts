import * as mongoose from 'mongoose';
import {PaginateModel} from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate';
import {IRegion} from '../../interfaces/region.interface';

export interface IRegionModel extends IRegion, mongoose.Document {}
const regionSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: true
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

const Region = mongoose.model<IRegionModel>('Region', regionSchema);
export  default Region;
