import {ITeam} from './team.interface';
import {IUser} from './user.interface';

export interface IInventoryLabel {
  _id: any;
  team?: ITeam;
  name: string;
  color: string;
  affected: string[];
  sendTo: string;
  requireCustomText: boolean;
  isExhibition: boolean;
  active: boolean;
  updatedBy?: IUser;
}
