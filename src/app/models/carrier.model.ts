import * as mongoose from 'mongoose';
import {PaginateModel} from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate';
import {ICarrier} from '../../interfaces/carrier.interface';

export interface ICarrierModel extends ICarrier, mongoose.Document {}
const carrierSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: true
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  }
}, {
  timestamps: true
});

carrierSchema.plugin(mongoosePaginate);

export type CarrierSchema = mongoose.Model<ICarrierModel> & PaginateModel<ICarrierModel> & {};

const Carrier = mongoose.model<ICarrierModel, CarrierSchema>('Carrier', carrierSchema);
export  default Carrier;
