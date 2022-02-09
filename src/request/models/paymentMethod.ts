import * as mongoose from 'mongoose';
import {PaginateModel} from 'mongoose';
import {IPaymentMethod} from '../interfaces/paymentMethod.interface';
import {ICarModel} from '../../app/models/car.model';

export interface IPaymentMethodModel extends IPaymentMethod, mongoose.Document {}

const paymentMethodSchema = new mongoose.Schema({
  name: {
    type: String
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  }
}, {
  timestamps: true
});

export type PaymentMethodSchema = mongoose.Model<IPaymentMethodModel> & PaginateModel<IPaymentMethodModel> & {
  findOneOrCreate(condition: any, create: any): Promise<ICarModel>
};

const PaymentMethod = mongoose.model<IPaymentMethodModel, PaymentMethodSchema>('PaymentMethod', paymentMethodSchema);

export default PaymentMethod;

