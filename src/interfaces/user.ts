export interface IUser {
  _id: any;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  hash_password: string;
  passwordResetToken: string;
  passwordResetExpires: Date;
  lastLogin: Date;
  active: boolean;
  updatedAt: Date;
}
