import * as mongoose from 'mongoose';
import { PaginateModel } from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate';
import {ITransmittalTransporter} from '../../interfaces/transmittalTransporter.interface';

export interface ITransmittalTransporterModel extends ITransmittalTransporter, mongoose.Document { }

const transmittalTransporterSchema = new mongoose.Schema({
  transmittal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transmittal'
  },
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

transmittalTransporterSchema.plugin(mongoosePaginate);

export type TransmittalTransporterSchema = mongoose.Model<ITransmittalTransporterModel> & PaginateModel<ITransmittalTransporterModel>;

const TransmittalTransporter = mongoose.model<ITransmittalTransporterModel, TransmittalTransporterSchema>('TransmittalTransporter', transmittalTransporterSchema);

export default TransmittalTransporter;
