import * as mongoose from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate-v2';

import { PaginateModel } from 'mongoose';
import {IBrand} from "../interfaces/brand.interface";

export interface IBrandModel extends IBrand, mongoose.Document<any> {}

const brandSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: true
  },
  aliases: [{
    type: String,
    trim: true
  }],
  fallback: {
    type: Boolean,
    default: false
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  }
}, {
  timestamps: true
});

brandSchema.plugin(mongoosePaginate);

export type BrandSchema = mongoose.Model<IBrandModel> & PaginateModel<IBrandModel> & {};

const Brand = mongoose.model<IBrandModel, BrandSchema>('Brand', brandSchema);
export default Brand;
