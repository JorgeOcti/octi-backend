import * as mongoose from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate-v2';

import { PaginateModel } from 'mongoose';
import type { IBorder } from "../interfaces/border.interface";

export interface IBorderModel extends IBorder, mongoose.Document<any> {}

export const borderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  lat: {
    type: Number,
    default: 0
  },
  lng: {
    type: Number,
    default: 0
  },
});

borderSchema.set<any>('redisCache', process.env.ENV === 'production');
borderSchema.set<any>('expires', 30);

borderSchema.index({ 'team': 1 });
borderSchema.index({ 'company': 1 });

mongoose.plugin(mongoosePaginate);

export type BorderSchema = mongoose.Model<IBorderModel> & PaginateModel<IBorderModel>;

export const Border = mongoose.model<IBorderModel, BorderSchema>('Border', borderSchema);

export default Border;
