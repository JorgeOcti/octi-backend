import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import * as mongoose from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate';
import * as passportLocalMongoose from 'passport-local-mongoose';
import {IUser} from '../../interfaces/user.interface';
// import mongooseCrate  from 'mongoose-crate';
// import S3 from 'mongoose-crate-s3';

export interface IUserModel extends IUser, mongoose.Document {
  comparePassword: (candidatePassword: string, cb: (err: any, isMatch: any) => {}) => void;
  comparePasswordSync: (candidatePassword: string) => void;
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
  timestamps: true
});

userSchema.plugin(passportLocalMongoose);
// https://www.npmjs.com/package/mongoose-paginate
userSchema.plugin(mongoosePaginate);
// userSchema.plugin(mongooseCrate, {
//   storage: new S3({
//     key: 'REDACTED',
//     secret: 'REDACTED',
//     bucket: 'REDACTED',
//     acl: 'public-read', // defaults to public-read
//     region: 'eu-west-1', // defaults to us-standard
//     // where the file is stored in the bucket - defaults to this function
//     path: (attachment) => `/${path.basename(attachment.path)}`
//   }),
//   fields: {
//     file: {}
//   }
// });

/**
 * Password hash middleware.
 */

userSchema.methods.fullName = function(): string {
  return (this.firstName.trim() + ' '  + this.lastName.trim());
};

userSchema.methods.generateToken = function() {
  const userInfo = {
    _id: this._id,
    firstName: this.firstName,
    lastName: this.lastName,
    email: this.email,
    company: this.company,
    venue: this.venue
  };
  return jwt.sign(userInfo, process.env.SECRET_KEY || 'secretKey', {expiresIn: '7 days'});
};

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
