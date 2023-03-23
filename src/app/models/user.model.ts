import * as bcrypt from 'bcrypt';
import * as mongoose from 'mongoose';
import { CallbackWithoutResultAndOptionalError } from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate-v2';
import * as passportLocalMongoose from 'passport-local-mongoose';
import { IUserModel, UserSchema, userSchema } from '../schemas/user.schema';
import usersHooks from './user.hooks';
import UserServices from './user.services';

userSchema.set<any>('redisCache', process.env.ENV === 'production');
userSchema.set<any>('expires', 30);

userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ venue: 1 });
userSchema.index(
  { firstName: 'text', lastName: 'text', email: 'text' },
  {
    default_language: 'spanish',
    weights: {
      firstName: 5,
      lastName: 10
    },
    name: 'TextIndex'
  }
);

userSchema.plugin(passportLocalMongoose);
// https://www.npmjs.com/package/mongoose-paginate
userSchema.plugin(mongoosePaginate);

userSchema.post<IUserModel>('findOneAndUpdate', async (doc: any) => {
  await usersHooks.postFindOneAndUpdateHandler(doc);
});

userSchema.methods.fullName = function (this: IUserModel): string {
  return new UserServices(this).fullName();
};

// validate user has permissions
userSchema.methods.hasPermission = function (
  this: IUserModel,
  permission: string
): boolean {
  return new UserServices(this).hasPermission(permission);
};

// used by sockets
userSchema.methods.generateToken = function (this: IUserModel): string {
  return new UserServices(this).generateToken();
};

userSchema.methods.venuesPermissions = function (
  this: IUserModel,
  inString?: boolean
): any[] {
  return new UserServices(this).venuesPermissions(inString);
};

userSchema.methods.comparePassword = async function (
  this: IUserModel,
  candidatePassword: string
): Promise<boolean> {
  return await new UserServices(this).comparePassword(candidatePassword);
};

/**
 * Password hash middleware.
 */
userSchema.pre(
  'save',
  function (this: IUserModel, next: CallbackWithoutResultAndOptionalError) {
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
  }
);

export const User = mongoose.model<IUserModel, UserSchema>('User', userSchema);

export default User;
