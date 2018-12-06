import * as mongoose from 'mongoose';
import {
  IInventory,
  IInventoryCar
} from '../../interfaces/inventory.interface';

export interface IInventoryCarModel extends IInventoryCar, mongoose.Types.Subdocument {}

export enum ChoicesStatusCarInventory {
  pending = 'pending',
  found = 'found',
  leftover = 'leftover',
  reported = 'reported'
}
export const choicesStatusCarInventory = [
  ChoicesStatusCarInventory.pending,
  ChoicesStatusCarInventory.found,
  ChoicesStatusCarInventory.leftover,
  ChoicesStatusCarInventory.reported
];
const inventoryCarSchema = new mongoose.Schema({
  car: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Car'
  },
  venue: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Venue'
  },
  venueFound: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Venue'
  },
  inventoriedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  images: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InventoryFile'
  }],
  status: {
    type: String,
    enum: choicesStatusCarInventory,
    default: ChoicesStatusCarInventory.pending
  }
});

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
  cars: [inventoryCarSchema],
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

const Inventory = mongoose.model<IInventoryModel>('Inventory', inventorySchema);

export default Inventory;
