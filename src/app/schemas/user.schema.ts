
import * as mongoose from 'mongoose';
import { PaginateModel } from 'mongoose';
import { UserTypes, userTypes } from '../models/user.model.types';

import type { IUser } from '../interfaces/user.interface';

export interface IUserModel extends IUser, mongoose.Document<any> {
  comparePassword(candidatePassword: string): Promise<boolean>;

  generateToken(): string;

  hasPermission(permission: string): boolean;

  fullName(): string;

  venuesPermissions(inString?: boolean): any[];
}

export type UserSchema = mongoose.Model<IUserModel> & PaginateModel<IUserModel>;

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


