import type { ITeam } from '../../app/interfaces/team.interface';
import type { IUser } from '../../app/interfaces/user.interface';

export interface IInventoryLabel {
  _id?: any;
  team?: ITeam;
  name: string;
  description: string;
  color: string;
  affected: string[];
  sendTo: string;
  requireCustomText: boolean;
  isExhibition: boolean;
  active: boolean;
  isForContainer: boolean;
  updatedBy?: IUser;
}
