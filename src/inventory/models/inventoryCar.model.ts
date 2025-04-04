import * as mongoose from 'mongoose';
import type {
  IInventoryCar
} from '../interfaces/inventory.interface';
import type { IInventoryComment } from '../interfaces/inventoryComment.interface';

export interface IIventoryCommentModel extends IInventoryComment, mongoose.Types.Subdocument { }

const invetoryCommentCars = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  comment: {
    type: String
  },
  createdAt: {
    type: Date,
    default: new Date()
  }
});

export enum ChoicesStatusCarInventory {
  pending = 'pending',
  found = 'found',
  missing = 'missing',
  leftover = 'leftover',
  reported = 'reported',
  deleted = 'deleted'
}

export const choicesStatusCarInventory = [
  ChoicesStatusCarInventory.pending,
  ChoicesStatusCarInventory.found,
  ChoicesStatusCarInventory.leftover,
  ChoicesStatusCarInventory.missing,
  ChoicesStatusCarInventory.reported,
  ChoicesStatusCarInventory.deleted
];


export enum ChoicesStatusContainer {
  pending = 'pending',
  open = 'open',
  check = 'check',
  empty = 'empty',
  missing = 'missing',
}

export const choicesStatusContainer = [
  ChoicesStatusContainer.pending,
  ChoicesStatusContainer.open,
  ChoicesStatusContainer.check,
  ChoicesStatusContainer.empty,
  ChoicesStatusContainer.missing
];


export interface IInventoryCarModel extends IInventoryCar, mongoose.Document { }

const inventoryCarSchema = new mongoose.Schema({
  inventory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Inventory'
  },
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
  files: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InventoryFile'
  }],
  comments: [invetoryCommentCars],
  label: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InventoryLabel'
  },
  labelText: {
    type: String,
    default: ''
  },
  labelBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  customizedStatusText: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: choicesStatusCarInventory,
    default: ChoicesStatusCarInventory.pending
  },
  containerStatus: {
    type: String,
    enum: choicesStatusContainer,
    default: ChoicesStatusContainer.pending
  },
  container: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InventoryCar'
  },
  containerFound: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InventoryCar'
  },
  evidenceStatus: {
    type: [{status: String, date: Date, images: [{type: mongoose.Schema.Types.ObjectId, ref: 'InventoryFile'}]}],
    default: []
  },
  extra: {
    type: Object,
    default: {}
  },
  virtualInventory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VirtualInventory'
  },
  participant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Participant',
    required: false
  }
}, {
  timestamps: true
});

inventoryCarSchema.index({ status: 1 });
inventoryCarSchema.index({ inventory: 1, car: 1 });
inventoryCarSchema.index({ inventory: 1, status: 1, venue: 1, venueFound: 1 });
inventoryCarSchema.index({ venue: 1, venueFound: 1, createdAt: 1 });

const InventoryCar = mongoose.model<IInventoryCarModel>('InventoryCar', inventoryCarSchema);

export default InventoryCar;
