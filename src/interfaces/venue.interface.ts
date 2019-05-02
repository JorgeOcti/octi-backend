import {ICarrier} from './carrier.interface';
import {ICompany} from './company.interface';
import {IParticipant} from './participant.interface';
import {IRegion} from './region.interface';
import {ITeam} from './team.interface';
import {IUser} from './user.interface';

export interface IBaseVenue {
  _id: any;
  name: string;
  company?: ICompany | any;
  region?: IRegion[] | any;
  sendTo: IVenue[];
  receiveFrom: IVenue[];
  receptionCarriers: ICarrier[];
  shippingCarriers: ICarrier[];
  type: string;
}

export interface IVenue extends IBaseVenue {
  name: string;
  team?: ITeam | any;
  users?: IUser[];
  participants?: IParticipant[];
  active: boolean;
  deleted: boolean;
  updatedAt?: Date;
  createdAt?: Date;
}
