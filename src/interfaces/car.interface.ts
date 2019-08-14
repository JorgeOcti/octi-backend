import {ICompany} from './company.interface';
import {IInventoryCar} from './inventory.interface';
import {IParticipant} from './participant.interface';
import {ITeam} from './team.interface';
import {IUser} from "./user.interface";

export interface ICar {
  _id: any;
  internalNumber: string;
  patent: string;
  engineNumber: string;
  vin: string;
  vin2: string;
  brand: string;
  denomination: string;
  destination: string;
  property: string;
  type: string;
  isExhibition: boolean;
  color: string;
  team: ITeam | any;
  company: ICompany | any;
  lastForm: IParticipant | any;
  participants?: IParticipant[];
  inventories?: IInventoryCar[];
  status: string;
  createdBy?: IUser;
  updatedAt: Date;
  createdAt: Date;
}
