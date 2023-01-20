import type { ICompany } from './company.interface';
import type { ITeamSetting } from './teamSetting.interface';
import type { ITeamSettingModel } from '../models/teamSetting.model';
import type { IUser } from './user.interface';

export interface ITeam {
  _id?: any;
  name: string;
  formsNumber: number;
  requestNumber: number;
  transmittalNumber: number;
  companies?: ICompany[];
  settings: ITeamSetting | ITeamSettingModel;
  active: boolean;
  users?: IUser[];
  updatedAt: Date;
  createdAt: Date;
}
