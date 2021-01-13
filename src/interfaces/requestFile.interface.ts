import { ICompanyModel } from '../app/models/company.model';
import { IUserModel } from '../app/models/user.model';
import { IIFile } from './file.interface';

export interface IRequestFile {
  _id: any;
  company: ICompanyModel;
  user: IUserModel;
  file: IIFile;
}
