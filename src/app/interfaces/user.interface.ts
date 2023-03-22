import type { ICompany } from './company.interface';
import type { IForm } from '../../form/interfaces/form.interface';
import type { IGroup } from './group.interface';
import type { IPermission } from '../../billing/interfaces/permission.interface';
import type { ISalesChannel } from '../../request/interfaces/salesChannel.interface';
import type { ITeam } from './team.interface';
import type { ITeamModel } from '../models/team.model';
import type { IVenue } from './venue.interface';

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
  venuesAccess: IVenue[] | any[];
  companiesAccess: ICompany[] | any[];
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
