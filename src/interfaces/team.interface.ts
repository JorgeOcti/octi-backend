import {IUser} from './user.interface';
import {ITeamSetting} from './teamSetting.interface';
import {ITeamSettingModel} from '../app/models/teamSetting.model';
import { ICompany } from './company.interface';

export interface ITeam {
  _id: any;
  name: string;
  formsNumber: number;
  requestNumber: number;
  companies?: ICompany[];
  settings: ITeamSetting | ITeamSettingModel;
  active: boolean;
  users?: IUser[];
  updatedAt: Date;
  createdAt: Date;
}
