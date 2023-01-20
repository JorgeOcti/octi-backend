import * as mongoose from 'mongoose';
import { PaginateModel } from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate-v2';
import type { IInventoryLabel } from '../interfaces/inventoryLabel.interface';
import { choicesStatusCarInventory } from './inventoryCar.model';

export interface IInventoryLabelModel extends IInventoryLabel, mongoose.Document<any> { }

export const inventoryLabelSchema = new mongoose.Schema({
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ""
  },
  color: {
    type: String,
    default: '#C4C4C4'
  },
  affected: [{
    type: String,
    enum: choicesStatusCarInventory
  }],
  sendTo: {
    type: String,
    enum: choicesStatusCarInventory,
    required: true
  },
  isExhibition: {
    type: Boolean,
    default: false
  },
  requireCustomText: {
    type: Boolean,
    default: false
  },
  active: {
    type: Boolean,
    default: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

mongoose.plugin(mongoosePaginate);

inventoryLabelSchema.index({ active: 1, team: 1 });

export type InventoryLabelSchema = mongoose.Model<IInventoryLabelModel> & PaginateModel<IInventoryLabelModel>;

const InventoryLabel = mongoose.model<IInventoryLabelModel, InventoryLabelSchema>('InventoryLabel', inventoryLabelSchema);

export default InventoryLabel;
