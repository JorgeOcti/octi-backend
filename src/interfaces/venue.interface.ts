import {ICompany} from './company.interface';
import {IParticipant} from './participant.interface';
import {IUser} from './user.interface';

export interface IBaseVenue {
  _id: any;
  name: string;
  type: string;
}

export interface IVenue extends IBaseVenue {
  name: string;
  company?: ICompany | any;
  users?: IUser[];
  participants?: IParticipant[];
  active: boolean;
  updatedAt?: Date;
  createdAt?: Date;
}
