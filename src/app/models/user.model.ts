import * as bcrypt from 'bcrypt';
import * as mongoose from 'mongoose';
import * as passportLocalMongoose from 'passport-local-mongoose';

export interface IUserModel extends mongoose.Document {
  username: string;
  email: string;
  name: string;
  lastName: string;
  password: string;
  hash_password: string;
  passwordResetToken: string;
  passwordResetExpires: Date;
  active: boolean;

  comparePassword: (candidatePassword: string, cb: (err: any, isMatch: any) => {}) => void;
  comparePasswordSync: (candidatePassword: string) => void;

}

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true
  },
  name: {
    type: String,
    default: ''
  },
  lastName: {
    type: String,
    default: ''
  },
  email: {type: String, unique: true, index: true},
  password: String,
  hash_password:  String,
  passwordResetToken: String,
  passwordResetExpires: Date,

  active: Boolean
}, {
  timestamps: true
});

userSchema.plugin(passportLocalMongoose);

/**
 * Password hash middleware.
 */
userSchema.pre('save', function save(next) {
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

// const User = mongoose.model('User', userSchema);
const User = mongoose.model<IUserModel>('User', userSchema);

export default User;
