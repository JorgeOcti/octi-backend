import * as mongoose from 'mongoose';
import { PaginateModel } from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate';
import {IDamages} from '../../interfaces/damage.interface';

export interface IDamagesModel extends IDamages, mongoose.Document {}
export const damagesSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  parts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Part'
  }],
  kinds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Kind'
  }],
  positions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Position'
  }]
}, {
  timestamps: true
});

damagesSchema.plugin(mongoosePaginate);

export type DamagesSchema = mongoose.Model<IDamagesModel> & PaginateModel<IDamagesModel>;

const Damages = mongoose.model<IDamagesModel, DamagesSchema>('Damages', damagesSchema);
export default Damages;
