import {ICompany} from "./company.interface";

export interface ICar {
  _id: any;
  vin: string;
  company: ICompany | any;
  updatedAt: Date;
  createdAt: Date;
}
