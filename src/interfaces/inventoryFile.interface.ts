import {ICompanyModel} from '../app/models/company.model';
import {IUserModel} from '../app/models/user.model';
import {IInventoryModel} from '../inventory/models/inventory.model';

export interface IIFile {
  url: string;
  type: string;
  name: string;
  size: number;
}

export interface IInventoryFile {
  _id: any;
  inventory: IInventoryModel | string;
  company: ICompanyModel;
  user: IUserModel;
  file: IIFile;
}
