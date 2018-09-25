import * as mongoose from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate';
import {IPermission} from '../../interfaces/permision.interface';

export interface IPermissionModel extends IPermission, mongoose.Document {}

const permisionSchema = new mongoose.Schema({
  name: {
    type: String,
    unique: true
  },
  codeName: {
    type: String,
    unique: true
  }
}, {
  timestamps: true
});

permisionSchema.plugin(mongoosePaginate);

const Permission = mongoose.model<IPermissionModel>('Permission', permisionSchema);

export default Permission;
