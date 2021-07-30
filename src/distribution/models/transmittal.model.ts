import * as mongoose from 'mongoose';
import {AggregatePaginateModel, PaginateModel} from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate';
import {ITransmittal} from '../interfaces/transmittal.interface';
import mongooseAggregatePaginate = require('mongoose-aggregate-paginate-v2');


export interface ITransmittalModel extends ITransmittal, mongoose.Document { }

export enum ChoicesStatusTransmittal {
  pending = 'pending',
  inTransit = 'inTransit',
  damaged = 'damaged',
  completed = 'completed',
}

export const choicesStatusTransmittal = [
  ChoicesStatusTransmittal.pending,
  ChoicesStatusTransmittal.inTransit,
  ChoicesStatusTransmittal.damaged,
  ChoicesStatusTransmittal.completed,
];

const transmittalTransporterSchema = new mongoose.Schema({
  carrier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Carrier'
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  patent: {
    type: String,
  },
}, {
  timestamps: true
});

const transmittalSchema = new mongoose.Schema<ITransmittal>({
  name: {
    type: String
  },
  number: {
    type: Number
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  files: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TransmittalFile'
  }],
  evidenceFullLoad: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TransmittalFile'
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  transporter: {
    type: transmittalTransporterSchema
  },
  observation: {
    type: String
  },
  status: {
    type: String,
    enum: choicesStatusTransmittal,
    default: ChoicesStatusTransmittal.pending
  }
}, {
  timestamps: true
});


transmittalSchema.virtual('items', {
  ref: 'TransmittalItem', // The model to use
  localField: '_id', // Find field in this model
  foreignField: 'transmittal', // is equal to field in another model
  justOne: false
});

transmittalSchema.set('toObject', { virtuals: true });
transmittalSchema.set('toJSON', { virtuals: true });

transmittalSchema.plugin(mongoosePaginate);
transmittalSchema.plugin(mongooseAggregatePaginate);


export type TransmittalSchema = mongoose.Model<ITransmittalModel> & PaginateModel<ITransmittalModel>& AggregatePaginateModel<ITransmittalModel>;

const Transmittal = mongoose.model<ITransmittalModel, TransmittalSchema>('Transmittal', transmittalSchema);

export default Transmittal;
