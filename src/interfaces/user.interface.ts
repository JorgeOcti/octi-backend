import {ICompany} from "./company.interface";

export interface IUser {
  _id: any;
  username: string;
  firstName: string;
  lastName: string;
  company: ICompany | any;
  email: string;
  password: string;
  hash_password: string;
  passwordResetToken: string;
  passwordResetExpires: Date;
  lastLogin: Date;
  active: boolean;
  updatedAt: Date;
  createdAt: Date;
}
