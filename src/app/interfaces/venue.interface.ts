import { ICarrier } from './carrier.interface';
import { ICompany } from './company.interface';
import { IParticipant } from '../../form/interfaces/participant.interface';
import { IRegion } from './region.interface';
import { ITeam } from './team.interface';
import { IUser } from './user.interface';
import { IVenueDay } from './venueDay.interface';

export interface IBaseVenue {
  sendToDays: IVenueDay[];
  _id: any;
  name: string;
  abbreviation: string;
  lat: number;
  lng: number;
  company?: ICompany | any;
  region?: IRegion[] | any;
  sendTo: IVenue[];
  shippingMaxDays: number;
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
