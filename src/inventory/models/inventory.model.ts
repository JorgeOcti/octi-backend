import * as mongoose from 'mongoose';
import {
  IInventory
} from '../../interfaces/inventory.interface';

export interface IInventoryModel extends IInventory, mongoose.Document {}
export enum ChoicesStatusInventory {
  pending = 'pending',
  inProcess = 'inProcess',
  finalized = 'finalized'
}
export const choicesStatusInventory = [
  ChoicesStatusInventory.pending,
  ChoicesStatusInventory.inProcess,
  ChoicesStatusInventory.finalized
];
const inventorySchema = new mongoose.Schema({
  name: {
    type: String
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  venues: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Venue'
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  finalizedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  finalizedAt: {
    type: Date
  },
  status: {
    type: String,
    enum: choicesStatusInventory,
    default: ChoicesStatusInventory.pending
  }
}, {
  timestamps: true
});

inventorySchema.virtual('cars', {
  ref: 'InventoryCar', // The model to use
  localField: '_id', // Find field in this model
  foreignField: 'inventory', // is equal to field in another model
  justOne: false
});

inventorySchema.index({team: 1});
inventorySchema.index({team: 1, status: 1, venues: 1});
const Inventory = mongoose.model<IInventoryModel>('Inventory', inventorySchema);

export default Inventory;
