import * as mongoose from 'mongoose';
import { PaginateModel } from 'mongoose';
import { IOperationType } from '../interfaces/operationType.interface';
import { ICarModel } from '../../app/models/car.model';
import * as mongoosePaginate from 'mongoose-paginate';

export interface IOperationTypeModel extends IOperationType, mongoose.Document {
}

const operationTypeSchema = new mongoose.Schema({
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

operationTypeSchema.set('toObject', { virtuals: true });
operationTypeSchema.set('toJSON', { virtuals: true });

operationTypeSchema.statics.findOneOrCreate = function(condition: any, create: any): Promise<ICarModel> {
  const model = this;
  return new Promise((resolve, reject) => {
    model.findOne(condition, (err: any, result: ICarModel) => {
      if (err) {
        return reject(err);
      }
      if (result) {
        return resolve(result);
      }
      model.create(create, (err: any, result: ICarModel) => {
        if (err) {
          return reject(err);
        }
        return resolve(result);
      });
    });
  });
};


operationTypeSchema.plugin(mongoosePaginate);

export type OperationTypeSchema = mongoose.Model<IOperationTypeModel> & PaginateModel<IOperationTypeModel> & {
  findOneOrCreate(condition: any, create: any): Promise<ICarModel>
};

const OperationType = mongoose.model<IOperationTypeModel, OperationTypeSchema>('OperationType', operationTypeSchema);

export default OperationType;

