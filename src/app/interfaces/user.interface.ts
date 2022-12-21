import { ICompany } from './company.interface';
import { IForm } from '../../form/interfaces/form.interface';
import { IGroup } from './group.interface';
import { IPermission } from '../../billing/interfaces/permission.interface';
import { ISalesChannel } from '../../request/interfaces';
import { ITeam } from './team.interface';
import { ITeamModel } from '../models/team.model';
import { IVenue } from './venue.interface';

export interface IUserSettings {
  defaultChannel: ISalesChannel;
}

export interface IUser {
  comparePassword(candidatePassword: string): Promise<boolean>;

  generateToken(): string;

  hasPermission(permission: string): boolean;

  fullName(): string;

  venuesPermissions(inString?: boolean): any[];

  _id?: any;
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
  password: string;
  hash_password: string;
  passwordResetToken: string | undefined;
  passwordResetExpires: Date | undefined;
  lastLogin: Date;
  type: string;
  token: string;
  active: boolean;
  updatedAt: Date;
  createdAt: Date;
  group: IGroup;
  userPermissions: IPermission[];
  userForms: IForm[];
  isAdmin: boolean;
  isDriver: boolean;
}
