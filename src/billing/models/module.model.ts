import { IModule } from '../interfaces';
import * as mongoose from 'mongoose';
import { PaginateModel } from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate-v2';

export interface IModuleModel extends IModule, mongoose.Document {
}

const moduleSchema = new mongoose.Schema({
  name: {
    type: String,
    unique: true
  }
}, {
  timestamps: true
});

moduleSchema.virtual('submodules', {
  ref: 'Submodule', // The model to use
  localField: '_id', // Find field in this model
  foreignField: 'module', // is equal to field in another model
  justOne: false
});

moduleSchema.statics.findOneOrCreate = function(condition: any, create: any): Promise<IModuleModel> {
  const model = this;
  return new Promise((resolve, reject) => {
    model.findOne(condition, (err: any, result: IModuleModel) => {
      if (err) {
        return reject(err);
      }
      if (result) {
        return resolve(result);
      }
      model.create(create, (err: any, result: IModuleModel) => {
        if (err) {
          return reject(err);
        }
        return resolve(result);
      });
    });
  });
};

moduleSchema.plugin(mongoosePaginate);

export type ModuleSchema = mongoose.Model<IModuleModel> & PaginateModel<IModuleModel> & {
  findOneOrCreate(condition: any, create: any): Promise<IModuleModel>
};

const Module = mongoose.model<IModuleModel, ModuleSchema>('Module', moduleSchema);

export default Module;
