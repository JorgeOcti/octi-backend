import {ICompany} from './company.interface';
import {IParticipant} from './participant.interface';
import {ITeam} from './team.interface';
import {IUser} from './user.interface';

export interface IBaseVenue {
  _id: any;
  name: string;
  company?: ICompany | any;
  type: string;
}

export interface IVenue extends IBaseVenue {
  name: string;
  team?: ITeam | any;
  company?: ICompany | any;
  users?: IUser[];
  participants?: IParticipant[];
  active: boolean;
  deleted: boolean;
  updatedAt?: Date;
  createdAt?: Date;
}
