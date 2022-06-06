import * as mongoose from 'mongoose';
import { PaginateModel } from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate';
import { IPermission } from '../interfaces';

export interface IPermissionModel extends IPermission, mongoose.Document {
}

const permissionSchema = new mongoose.Schema({
  name: {
    type: String,
    unique: true
  },
  codeName: {
    type: String,
    unique: true
  },
  submodule: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Submodule'
  }
}, {
  timestamps: true
});

permissionSchema.set<any>('redisCache', true);
permissionSchema.set<any>('expires', 30);

permissionSchema.plugin(mongoosePaginate);

export type PermissionSchema = mongoose.Model<IPermissionModel> & PaginateModel<IPermissionModel> & {};

const Permission = mongoose.model<IPermissionModel, PermissionSchema>('Permission', permissionSchema);

export default Permission;
