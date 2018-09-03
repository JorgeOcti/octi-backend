import * as mongoose from 'mongoose';
import {IInventory} from '../../interfaces/inventory.interface';

export interface IInventoryModel extends IInventory, mongoose.Document {}

export const choiceStatusInventory = ['pending', 'in_process', 'finalized'];
const inventorySchema = new mongoose.Schema({
  name: {
    type: String
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  cars: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Car'
  }],
  status: {
    type: String,
    enum: choiceStatusInventory,
    default: 'pending'
  }
}, {
  timestamps: true
});

const Inventory = mongoose.model<IInventoryModel>('Inventory', inventorySchema);

export default Inventory;
