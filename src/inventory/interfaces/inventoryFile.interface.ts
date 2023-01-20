import type { ICompanyModel } from '../../app/models/company.model';
import type { IUserModel } from '../../app/schemas/user.schema';
import type { IIFile } from '../../interfaces/file.interface';
import type { IInventoryModel } from '../models/inventory.model';

export interface IInventoryFile {
  _id?: any;
  inventory: IInventoryModel | string;
  company: ICompanyModel;
  user: IUserModel;
  file: IIFile;
}
