import * as mongoose from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate';
import {IInventoryLabel} from '../../interfaces/inventoryLabel.interface';
import {choicesStatusCarInventory} from './inventory.model';

export interface IInventoryLabelModel extends IInventoryLabel, mongoose.Document {}

export const inventoryLabelSchema = new mongoose.Schema({
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  name: {
    type: String,
    required: true
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

const InventoryLabel = mongoose.model<IInventoryLabelModel>('InventoryLabel', inventoryLabelSchema);

export default InventoryLabel;
