import {ITeam} from "./team.interface";
import {ICompany} from "./company.interface";

interface IIFile {
  url: string;
  type: string;
  name: string;
  size: number;
}

export interface IInvoice {
  _id: any;
  team: ITeam,
  company: ICompany,
  inventoryPrice: number;
  checklistPrice: number;
  inventoryCars: number;
  checklistCars: number;
  totalUF: number;
  totalDolar: number;
  totalPeso: number;
  valueUF: number;
  valueDolar: number;
  file: IIFile;
  updatedAt?: Date;
  createdAt?: Date;
}
