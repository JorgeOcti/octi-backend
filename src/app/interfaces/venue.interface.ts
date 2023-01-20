import type { ICarrier } from './carrier.interface';
import type { ICompany } from './company.interface';
import type { IParticipant } from '../../form/interfaces/participant.interface';
import type { IRegion } from './region.interface';
import type { ITeam } from './team.interface';
import type { IUser } from './user.interface';
import type { IVenueDay } from './venueDay.interface';

export interface IBaseVenue {
  sendToDays: IVenueDay[];
  _id?: any;
  name: string;
  code: string;
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
  responsible: IUser[];
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
