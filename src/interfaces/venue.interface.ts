import {ICompany} from './company.interface';
import {IParticipant} from './participant.interface';
import {IUser} from './user.interface';

export interface IBaseVenue {
  _id: any;
  name: string;
}

export interface IVenue extends IBaseVenue {
  name: string;
  company?: ICompany | any;
  users?: IUser[];
  participants?: IParticipant[];
  type: string;
  active: boolean;
  updatedAt?: Date;
  createdAt?: Date;
}
