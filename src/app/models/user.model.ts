import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import * as mongoose from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate';
import * as passportLocalMongoose from 'passport-local-mongoose';
import {IUser} from '../../interfaces/user.interface';
import {IPermissionModel} from './permision.model';

export interface IUserModel extends IUser, mongoose.Document {
  comparePassword: (candidatePassword: string, cb: (err: any, isMatch: any) => {}) => boolean;
  comparePasswordSync: (candidatePassword: string) => boolean;
  hasPermission: (permission: string) => boolean;
  fullName: () => string;
  generateToken: () => string;
}

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true
  },
  firstName: {
    type: String,
    default: null
  },
  lastName: {
    type: String,
    default: null
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: [true, 'La empresa es requerida'],
    index: true
  },
  venue: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Venue',
    required: [true, 'La sucursal es requerida']
  },
  preferred: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Form',
    default: null
  },
  email: {
    type: String,
    trim: true,
    required: [true, 'El email es requerido'],
    unique: true,
    index: true
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
  isAdmin: {
    type: Boolean,
    default: false
  },
  password: String,
  hash_password:  String,

  passwordResetToken: String,
  passwordResetExpires: Date,

  lastLogin: Date,

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

userSchema.plugin(passportLocalMongoose);
// https://www.npmjs.com/package/mongoose-paginate
userSchema.plugin(mongoosePaginate);

userSchema.methods.fullName = function(): string {
  return (this.firstName.trim() + ' '  + this.lastName.trim());
};

// validate user has permissions
userSchema.methods.hasPermission = function(permission: string): boolean {
  if (permission && permission.length && this.userPermissions && this.userPermissions.length) {
    return this.userPermissions.some((p: IPermissionModel) => p.codeName === permission);
  }
  return false;
};

// used by sockets
userSchema.methods.generateToken = function() {
  const userInfo = {
    _id: this._id
    // firstName: this.firstName,
    // lastName: this.lastName,
    // email: this.email,
    // company: this.company,
    // venue: this.venue
  };
  return jwt.sign(userInfo, process.env.SECRET_KEY || 'secretKey', {expiresIn: '7 days'});
};

/**
 * Password hash middleware.
 */
userSchema.pre('save', function(this: IUserModel, next) {
  const user = this;
  if (!user.isModified('password')) { return next(); }
  bcrypt.genSalt(10, (err, salt) => {
    if (err) { return next(err); }
    bcrypt.hash(user.password, salt, (err: mongoose.Error, hash) => {
      if (err) { return next(err); }
      user.password = hash;
      next();
    });
  });
});

userSchema.methods.comparePassword = function(candidatePassword: string, cb: (err: any, isMatch: any) => {}) {
  bcrypt.compare(candidatePassword, this.password, (err: mongoose.Error, isMatch: boolean) => {
    cb(err, isMatch);
  });
};

userSchema.methods.comparePasswordSync = function(candidatePassword: string) {
  return bcrypt.compareSync(candidatePassword, this.password);
};

const User = mongoose.model<IUserModel>('User', userSchema);

export default User;
