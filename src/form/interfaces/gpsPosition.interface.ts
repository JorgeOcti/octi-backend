import {ICompany} from '../../app/interfaces/company.interface';
import {ITeam} from '../../app/interfaces/team.interface';
import {IUser} from '../../app/interfaces/user.interface';
import {IVenue} from '../../app/interfaces/venue.interface';

export interface IGPSPosition {
  _id?: any;
  lat: number;
  lng: number;
  user: IUser;
  company: ICompany;
  team: ITeam;
  venue: IVenue;
  os: string;
  accuracy: number;
  provider: string;
  createdAt: Date;
  updatedAt: Date;
}
