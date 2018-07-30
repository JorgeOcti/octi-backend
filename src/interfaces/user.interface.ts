import {ICompany} from "./company.interface";
import {IVenue} from "./venue.interface";
import {IForm} from "./form.interface";

export interface IUser {
  _id: any;
  username: string;
  firstName: string;
  lastName: string;
  company: ICompany | any;
  venue: IVenue | any;
  preferred: IForm | any;
  email: string;
  password: string;
  hash_password: string;
  passwordResetToken: string | undefined;
  passwordResetExpires: Date | undefined;
  lastLogin: Date;
  active: boolean;
  updatedAt: Date;
  createdAt: Date;
  generateToken: () => string;
}
