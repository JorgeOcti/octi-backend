export interface IUser {
  username: string;
  email: string;
  name: string;
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
