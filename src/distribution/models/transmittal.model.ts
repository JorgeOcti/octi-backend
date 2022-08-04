import * as mongoose from 'mongoose';
import {AggregatePaginateModel, PaginateModel} from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate-v2';
import {ITransmittal} from '../interfaces/transmittal.interface';
import mongooseAggregatePaginate = require('mongoose-aggregate-paginate-v2');
import { ChoicesStatusTransmittal, choicesStatusTransmittal } from './transmitall.types';

export interface ITransmittalModel extends ITransmittal, mongoose.Document { }

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

export const transmittalSchema = new mongoose.Schema<ITransmittal>({
  name: {
    type: String
  },
  type: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MilestoneType'
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
  },
  needMarkBorder: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

transmittalSchema.virtual('revision', {
  ref: 'Participant', // The model to use
  localField: '_id', // Find field in this model
  foreignField: 'transmittal', // is equal to field in another model
  justOne: true
});

transmittalSchema.virtual('items', {
  ref: 'TransmittalItem', // The model to use
  localField: '_id', // Find field in this model
  foreignField: 'transmittal', // is equal to field in another model
  justOne: false
});

transmittalSchema.set('toObject', { virtuals: true });
transmittalSchema.set('toJSON', { virtuals: true });

transmittalSchema.index({ team: 1 });
transmittalSchema.index({ type: 1 });
transmittalSchema.index({ revision: 1 });
transmittalSchema.index({ evidenceFullLoad: 1 });
transmittalSchema.index({ items: 1 });
transmittalSchema.index({ files: 1 });
transmittalSchema.index({ createdBy: 1 });
transmittalSchema.index({ 'transporter.carrier': 1 });
transmittalSchema.index({ 'transporter.driver': 1 });
transmittalSchema.index({ team: 1, number: 1 });

transmittalSchema.set<any>('redisCache', process.env.ENV === 'production');
transmittalSchema.set<any>('expires', 30);

transmittalSchema.plugin(mongoosePaginate);
transmittalSchema.plugin(mongooseAggregatePaginate);

export type TransmittalSchema = mongoose.Model<ITransmittalModel> & PaginateModel<ITransmittalModel>& AggregatePaginateModel<ITransmittalModel>;

const Transmittal = mongoose.model<ITransmittalModel, TransmittalSchema>('Transmittal', transmittalSchema);

export default Transmittal;
