import * as mongoose from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate-v2';

import { ISubmodule } from '../interfaces';
import { PaginateModel } from 'mongoose';
import { modulesHistory } from '../../app/models/history.types';

export interface ISubmoduleModel extends ISubmodule, mongoose.Document<any> {}

const submoduleSchema = new mongoose.Schema({
  name: {
    type: String,
    unique: true
  },
  type: {
    type: String,
    enum: modulesHistory,
    required: true
  },
  module: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module',
    required: true
  }
}, {
  timestamps: true
});

submoduleSchema.virtual('permissions', {
  ref: 'Permission', // The model to use
  localField: '_id', // Find field in this model
  foreignField: 'submodule', // is equal to field in another model
  justOne: false
});

submoduleSchema.statics.findOneOrCreate = function(condition: any, create: any): Promise<ISubmoduleModel> {
  const model = this;
  return new Promise((resolve, reject) => {
    model.findOne(condition, (err: any, result: ISubmoduleModel) => {
      if (err) {
        return reject(err);
      }
      if (result) {
        return resolve(result);
      }
      model.create(create, (err: any, result: ISubmoduleModel) => {
        if (err) {
          return reject(err);
        }
        return resolve(result);
      });
    });
  });
};


submoduleSchema.plugin(mongoosePaginate);

export type SubmoduleSchema = mongoose.Model<ISubmoduleModel> & PaginateModel<ISubmoduleModel> & {
  findOneOrCreate(condition: any, create: any): Promise<ISubmoduleModel>
};

const Submodule = mongoose.model<ISubmoduleModel, SubmoduleSchema>('Submodule', submoduleSchema);

export default Submodule;
