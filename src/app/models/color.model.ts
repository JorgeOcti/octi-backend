import * as mongoose from 'mongoose';
import { PaginateModel } from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate-v2';
import { IColor } from '../interfaces';

export interface IColorModel extends IColor, mongoose.Document {
}

const carrierSchema = new mongoose.Schema({
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

carrierSchema.plugin(mongoosePaginate);

export type ColorSchema = mongoose.Model<IColorModel> & PaginateModel<IColorModel> & {};

const Color = mongoose.model<IColorModel, ColorSchema>('Color', carrierSchema);
export default Color;
