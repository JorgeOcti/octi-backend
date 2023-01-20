import type { ICompany } from '../../app/interfaces/company.interface';
import type { ITeam } from '../../app/interfaces/team.interface';
import type { IUser } from '../../app/interfaces/user.interface';

export interface IInventoryDetail {
  _id: any;
  name: string;
}

export interface IFormDetail {
  _id: any;
  name: string;
}

export interface ICarDetail {
  _id: any;
  vin: string;
}

export interface IResponseDetail {
  _id: any;
  item: any;
  number: number;
}

export interface IActivityHistoryInterface {
  team: ITeam;
  company: ICompany;
  user: IUser;
  type: string;
  inventory?: IInventoryDetail;
  form?: IFormDetail;
  car?: ICarDetail;
  request?: IResponseDetail;
  updatedAt?: Date;
  createdAt?: Date;
}
