import * as mongoose from 'mongoose';
import {
  IInventory,
  IInventoryCar
} from '../../interfaces/inventory.interface';

export interface IInventoryCarModel extends IInventoryCar, mongoose.Types.Subdocument {}
export const choicesStatusCarInventory = ['pending', 'notFound', 'found'];
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
  status: {
    type: String,
    enum: choicesStatusCarInventory,
    default: 'pending'
  }
});

export interface IInventoryModel extends IInventory, mongoose.Document {}
export const choicesStatusInventory = ['pending', 'in_process', 'finalized'];
const inventorySchema = new mongoose.Schema({
  name: {
    type: String
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
  status: {
    type: String,
    enum: choicesStatusInventory,
    default: 'pending'
  }
}, {
  timestamps: true
});

const Inventory = mongoose.model<IInventoryModel>('Inventory', inventorySchema);

export default Inventory;
