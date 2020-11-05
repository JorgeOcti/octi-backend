import {IUser} from './user.interface';
import {ITeamSetting} from "./teamSetting.interface";
import {ITeamSettingModel} from "../app/models/teamSetting.model";

export interface ITeam {
  _id: any;
  name: string;
  formsNumber: number;
  requestNumber: number;
  settings: ITeamSetting | ITeamSettingModel;
  active: boolean;
  users?: IUser[];
  updatedAt: Date;
  createdAt: Date;
}
