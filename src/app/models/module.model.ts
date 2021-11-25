import * as mongoose from 'mongoose';
import { PaginateModel } from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate';
import { IModule } from '../interfaces';

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

moduleSchema.plugin(mongoosePaginate);

export type ModuleSchema = mongoose.Model<IModuleModel> & PaginateModel<IModuleModel> & {};

const Module = mongoose.model<IModuleModel, ModuleSchema>('Module', moduleSchema);

export default Module;
