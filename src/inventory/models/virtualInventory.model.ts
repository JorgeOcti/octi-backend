import { model, Model, PaginateModel, Schema } from 'mongoose';
import { IVirtualInventory } from '../interfaces/virtualInventory.interface';
import { ChoicesStatusInventory, choicesStatusInventory } from './inventory.model';
import type { IInventory } from '../interfaces/inventory.interface';
import mongoose from 'mongoose';

const virtualInventorySchema = new Schema({
  name: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: choicesStatusInventory,
    default: ChoicesStatusInventory.pending
  },
  company: {
    type: Schema.Types.ObjectId,
    ref: 'Company'
  },
  team: {
    type: Schema.Types.ObjectId,
    ref: 'Team'
  }
}, {
  timestamps: true
});

export interface IInventoryVirtualModel extends IInventory, mongoose.Document {}

export type VirtualInventorySchema = Model<IVirtualInventory> & PaginateModel<IVirtualInventory>;

const VirtualInventory: VirtualInventorySchema = model<IVirtualInventory, VirtualInventorySchema>('VirtualInventory', virtualInventorySchema);

export default VirtualInventory;


