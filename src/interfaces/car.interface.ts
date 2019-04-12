import {ICompany} from './company.interface';
import {IInventoryCar} from './inventory.interface';
import {IParticipant} from './participant.interface';
import {ITeam} from './team.interface';

export interface ICar {
  _id: any;
  internalNumber: string;
  patent: string;
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
  updatedAt: Date;
  createdAt: Date;
}
