import * as mongoose from 'mongoose';
import type {
  IInventoryCar
} from '../interfaces/inventory.interface';
import type { IInventoryComment } from '../interfaces/inventoryComment.interface';
import { ChoicesStatusCarInventory } from '../../app/models/inventoryCar.types';
import mongooseAggregatePaginate = require('mongoose-aggregate-paginate-v2');
import * as mongoosePaginate from 'mongoose-paginate-v2';
import { AggregatePaginateModel, PaginateModel } from 'mongoose';

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

const inventoryCarContentSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true
  },
  content: [{
    type: Object,
    required: true
  }],
  participant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Participant',
    required: true
  },
  images: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InventoryFile'
  }],
},{
  id: false,
});

const contentDetailSchema = new mongoose.Schema({
  code: {
    type: String,
    required: false,
    default: ''
  },
  item: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    default: 1
  },
  extra: {
    type: Object,
    default: {}
  }
},{
  id: false,
})

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


export const allPosibleStatuses = [
  ...Object.values(choicesStatusCarInventory),
  ...Object.values(choicesStatusContainer),
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
  },
  openParticipant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Participant',
    required: false
  },
  closeParticipant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Participant',
    required: false
  },
  units: [inventoryCarContentSchema],
  contentDescription: [{
      type: String,
      required: true
    }],
  contentDetails: [contentDetailSchema],
}, {
  timestamps: true
});

inventoryCarSchema.index({ status: 1 });
inventoryCarSchema.index({ inventory: 1, car: 1 });
inventoryCarSchema.index({ inventory: 1, status: 1, venue: 1, venueFound: 1 });
inventoryCarSchema.index({ venue: 1, venueFound: 1, createdAt: 1 });

inventoryCarSchema.plugin(mongoosePaginate);
inventoryCarSchema.plugin(mongooseAggregatePaginate)



export type InventoryCarSchema = mongoose.Model<IInventoryCarModel> & PaginateModel<IInventoryCarModel> & AggregatePaginateModel<IInventoryCarModel>;
const InventoryCar = mongoose.model<IInventoryCarModel, InventoryCarSchema>('InventoryCar', inventoryCarSchema);

export default InventoryCar;
