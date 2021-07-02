import * as mongoose from 'mongoose';
import { PaginateModel } from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate';
import {ITransmittal} from '../../interfaces/transmittal.interface';

export interface ITransmittalModel extends ITransmittal, mongoose.Document { }

const transmittalSchema = new mongoose.Schema<ITransmittal>({
  name: {
    type: String
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  carrier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Carrier'
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
}, {
  timestamps: true
});

transmittalSchema.plugin(mongoosePaginate);

export type TransmittalSchema = mongoose.Model<ITransmittalModel> & PaginateModel<ITransmittalModel>;

const Transmittal = mongoose.model<ITransmittalModel, TransmittalSchema>('Transmittal', transmittalSchema);

export default Transmittal;
