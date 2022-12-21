import { ICompanyModel } from '../../app/models/company.model';
import { IIFile } from '../../interfaces/file.interface';
import { IInventoryModel } from '../models/inventory.model';
import { IUserModel } from '../../app/models/user.model';

export interface IInventoryFile {
  _id?: any;
  inventory: IInventoryModel | string;
  company: ICompanyModel;
  user: IUserModel;
  file: IIFile;
}
