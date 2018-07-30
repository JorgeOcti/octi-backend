import {ICompany} from './company.interface';
import {IParticipant} from './participant.interface';

export interface ICar {
  _id: any;
  internalNumber: number;
  vin: string;
  vin2: string;
  brand: string;
  denomination: string;
  destination: string;
  color: string;
  company: ICompany | any;
  lastForm: IParticipant | any;
  participants?: IParticipant[];
  updatedAt: Date;
  createdAt: Date;
}
