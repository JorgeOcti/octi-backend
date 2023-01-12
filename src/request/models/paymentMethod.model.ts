import * as mongoose from 'mongoose';

import {ICarModel} from '../../app/models/car.model';
import {IPaymentMethod} from '../interfaces/paymentMethod.interface';
import {PaginateModel} from 'mongoose';

export interface IPaymentMethodModel extends IPaymentMethod, mongoose.Document<any> {}

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

const PaymentMethodModel = mongoose.model<IPaymentMethodModel, PaymentMethodSchema>('PaymentMethod', paymentMethodSchema);

export default PaymentMethodModel;

