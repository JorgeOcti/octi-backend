import { ICompanyModel } from '../../app/models/company.model';
import { IUserModel } from '../../app/models/user.model';
import { IInventoryModel } from '../models/inventory.model';
import { IIFile } from '../../interfaces/file.interface';

export interface IInventoryFile {
  _id: any;
  inventory: IInventoryModel | string;
  company: ICompanyModel;
  user: IUserModel;
  file: IIFile;
}
