import {ICompany} from "./company.interface";
import {IVenue} from "./venue.interface";

export interface IUser {
  _id: any;
  username: string;
  firstName: string;
  lastName: string;
  company: ICompany | any;
  venue: IVenue | any;
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
