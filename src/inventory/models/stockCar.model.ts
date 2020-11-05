import * as mongoose from "mongoose";
import {IStockCar} from "../../interfaces/stock.interface";

export interface IStockCarModel extends IStockCar, mongoose.Document {}
const stockCarSchema = new mongoose.Schema({
  car: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Car'
  },
  stock: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stock'
  },
  venue: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Venue'
  }
}, {
  timestamps: true
});

const StockCar = mongoose.model<IStockCarModel>('StockCar', stockCarSchema);

export default StockCar;
