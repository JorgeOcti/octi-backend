import * as bcrypt from 'bcrypt';
import * as mongoose from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate-v2';
import * as passportLocalMongoose from 'passport-local-mongoose';

import { HookNextFunction, PaginateModel } from 'mongoose';
import { UserTypes, userTypes } from './user.model.types';

import { IUser } from '../interfaces';
import UserServices from './user.services';
import usersHooks from './user.hooks';

export interface IUserModel extends IUser, mongoose.Document<any> {
  comparePassword(candidatePassword: string): Promise<boolean>;

  generateToken(): string;

  hasPermission(permission: string): boolean;

  fullName(): string;

  venuesPermissions(inString?: boolean): any[];
}

const userSettingsSchema = new mongoose.Schema({
  defaultChannel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SalesChannel'
  }
});

export const baseUserSchema = new mongoose.Schema({
  username: {
    type: String,
  },
  firstName: {
    type: String,
    default: ''
  },
  lastName: {
    type: String,
    default: ''
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  },
  venue: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Venue'
  },
  email: {
    type: String,
    trim: true,
    required: [true, 'El email es requerido'],
  }
});

export const userSchema = new mongoose.Schema<IUser>({
  ...baseUserSchema.obj,
  venuesAccess: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Venue'
  }],
  preferred: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Form',
    default: null
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
  },
  userPermissions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Permission'
  }],
  userForms: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Form'
  }],
  type: {
    type: String,
    enum: userTypes,
    default: UserTypes.common
  },
  token: {
    type: String,
    unique: true,
    sparse: true
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  settings: {
    type: userSettingsSchema,
    default: {}
  },
  password: String,
  hash_password: String,

  passwordResetToken: String,
  passwordResetExpires: Date,

  lastLogin: Date,

  isDriver: {
    type: Boolean,
    default: false
  },

  active: {
    type: Boolean,
    default: true
  }
}, {
  // toObject: {
  //   transform:  (doc, ret) => {
  //     delete ret._id;
  //     delete ret.password;
  //   }
  // },
  toJSON: {
    transform: (doc, ret) => {
      // delete ret._id;
      delete ret.password;
    }
  },
  timestamps: true
});

userSchema.set<any>('redisCache', process.env.ENV === 'production');
userSchema.set<any>('expires', 30);

userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ venue: 1 });
userSchema.index({ venuesAccess: 1 });

userSchema.plugin(passportLocalMongoose);
// https://www.npmjs.com/package/mongoose-paginate
userSchema.plugin(mongoosePaginate);

userSchema.post<IUserModel>('findOneAndUpdate', async (doc: any) => {
  await usersHooks.postFindOneAndUpdateHandler(doc);
});

userSchema.methods.fullName = function(this: IUserModel): string {
  return new UserServices(this).fullName();
};

// validate user has permissions
userSchema.methods.hasPermission = function(this: IUserModel, permission: string): boolean {
  return new UserServices(this).hasPermission(permission);
};

// used by sockets
userSchema.methods.generateToken = function(this: IUserModel): string {
  return new UserServices(this).generateToken();
};

userSchema.methods.venuesPermissions = function(this: IUserModel, inString?: boolean): any[] {
  return new UserServices(this).venuesPermissions(inString);
};

userSchema.methods.comparePassword = async function(this: IUserModel, candidatePassword: string): Promise<boolean> {
  return await new UserServices(this).comparePassword(candidatePassword);
};

/**
 * Password hash middleware.
 */
userSchema.pre('save', function(this: IUserModel, next: HookNextFunction) {
  const user = this;
  if (!user.isModified('password')) {
    return next();
  }
  bcrypt.genSalt!(10, (err, salt) => {
    if (err) {
      return next(err);
    }
    bcrypt.hash!(user.password, salt, (err: mongoose.Error, hash) => {
      if (err) {
        return next(err);
      }
      user.password = hash;
      next();
    });
  });
});


export type UserSchema = mongoose.Model<IUserModel> & PaginateModel<IUserModel>;

export const User = mongoose.model<IUserModel, UserSchema>('User', userSchema);

export default User;
