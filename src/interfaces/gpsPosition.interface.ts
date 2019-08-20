import {IUser} from "./user.interface";
import {ICompany} from "./company.interface";
import {ITeam} from "./team.interface";
import {IVenue} from "./venue.interface";

export interface IGPSPosition {
  _id: any;
  lat: number,
  lng: number,
  user: IUser,
  company: ICompany,
  team: ITeam,
  venue: IVenue
  os: string,
  accuracy: number,
  provider: string,
  createdAt: Date;
  updatedAt: Date;
}
