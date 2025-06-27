import type { ICompany } from '../../app/interfaces/company.interface';
import type { ITeam } from '../../app/interfaces/team.interface';

interface IIFile {
  url: string;
  type: string;
  name: string;
  size: number;
}

export interface IInvoice {
  _id?: any;
  team: ITeam;
  company: ICompany;
  period: string;
  inventoryPrice: number;
  checklistPrice: number;
  requestPrice: number;
  deliveryPrice: number;
  inventoryCars: number;
  checklistCars: number;
  deliveryCars: number;
  requestCars: number;
  containers: number;
  containersPrice: number;
  totalUF: number;
  totalDolar: number;
  totalPeso: number;
  valueUF: number;
  valueDolar: number;
  file: IIFile;
  updatedAt?: Date;
  createdAt?: Date;
}
