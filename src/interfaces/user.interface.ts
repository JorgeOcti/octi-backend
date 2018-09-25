import {ICompany} from './company.interface';
import {IForm} from './form.interface';
import {IGroup} from './group.interface';
import {IPermission} from './permision.interface';
import {IVenue} from './venue.interface';

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
  group: IGroup;
  userPermissions: IPermission[];
  userForms: IForm[];
  isAdmin: boolean;
  generateToken: () => string;
}
