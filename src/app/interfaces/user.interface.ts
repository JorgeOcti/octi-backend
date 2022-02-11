import { ITeamModel } from '../models/team.model';
import { ICompany } from './company.interface';
import { IForm } from '../../form/interfaces/form.interface';
import { IGroup } from './group.interface';
import { IPermission } from './permission.interface';
import { ITeam } from './team.interface';
import { IVenue } from './venue.interface';
import { ISalesChannel } from '../../request/interfaces';

export interface IUserSettings {
  defaultChannel: ISalesChannel;
}

export interface IUser {
  _id: any;
  username: string;
  firstName: string;
  lastName: string;
  team: ITeamModel | ITeam;
  company: ICompany | any;
  venue: IVenue | any;
  settings: IUserSettings;
  venuesAccess: IVenue | any;
  preferred: IForm | any;
  email: string;
  password?: string;
  hash_password: string;
  passwordResetToken: string | undefined;
  passwordResetExpires: Date | undefined;
  lastLogin: Date;
  active: boolean;
  token?: string;
  updatedAt: Date;
  createdAt: Date;
  group: IGroup;
  userPermissions: IPermission[];
  userForms: IForm[];
  isAdmin: boolean;
  isDriver: boolean;
  generateToken: () => string;
}
