import {ITeam} from '../../app/interfaces/team.interface';
import {IUser} from '../../app/interfaces/user.interface';
import {ICompany} from '../../app/interfaces/company.interface';

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
