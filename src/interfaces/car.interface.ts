import {ICompany} from "./company.interface";
import {IParticipant} from "./participant.interface";

export interface ICar {
  _id: any;
  vin: string;
  company: ICompany | any;
  lastForm: IParticipant | any;
  updatedAt: Date;
  createdAt: Date;
}
