
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
    lowercase: true,
    trim: true
  },
  firstName: {
    type: String,
    uppercase: true,
    trim: true,
    default: '',
  },
  lastName: {
    type: String,
    uppercase: true,
    trim: true,
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
    lowercase: true,
    trim: true,
    required: [true, 'El email es requerido'],
  }
});

export const userSchema = new mongoose.Schema<IUser>({
  ...baseUserSchema.obj,
  companiesAccess: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  }],
  venuesAccess: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Venue'
  }],
  userBrands: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand'
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
  /**
   * Acceso a herramientas que cruzan la frontera de team/company (por ejemplo
   * copiar un formulario de un team a otro). NO es parte de `userPermissions`
   * a propósito: no aparece en el admin de permisos y no se puede otorgar por
   * error desde la UI.
   *
   * NUNCA agregar este campo a un endpoint HTTP. Se otorga solo por CLI:
   *   npm run superadmin:grant -- --email=<email> --confirm=<email>
   *
   * Al leerlo para autorizar, NO usar `req.user`: la sesión es un snapshot JSON
   * del login (passportConfig.ts hace `done(null, user)` sin releer la base),
   * así que revocar el flag no tendría efecto hasta que expire la sesión.
   * Usar el middleware `isSuperAdmin`, que relee desde la base.
   */
  isSuperAdmin: {
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


