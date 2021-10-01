import * as mongoose from 'mongoose';
import { PaginateModel } from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate';
import { ISubmodule } from '../interfaces/submodule.interface';

export interface ISubmoduleModel extends ISubmodule, mongoose.Document {
}

const submoduleSchema = new mongoose.Schema({
  name: {
    type: String,
    unique: true
  },
  module: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module'
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

submoduleSchema.plugin(mongoosePaginate);

export type SubmoduleSchema = mongoose.Model<ISubmoduleModel> & PaginateModel<ISubmoduleModel> & {};

const Submodule = mongoose.model<ISubmoduleModel, SubmoduleSchema>('Submodule', submoduleSchema);

export default Submodule;
