import * as mongoose from 'mongoose';
import {IStock, IStockCar} from "../../interfaces/stock.interface";

export interface IStockModel extends IStock, mongoose.Document {
  cars: IStockCar[]
}

const stockSchema = new mongoose.Schema({
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
}, {
  timestamps: true
});

stockSchema.virtual('cars', {
  ref: 'StockCar', // The model to use
  localField: '_id', // Find field in this model
  foreignField: 'stock', // is equal to field in another model
  justOne: false
});

const Stock = mongoose.model<IStockModel>('Stock', stockSchema);

export default Stock;
