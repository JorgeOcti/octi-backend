import { ICompanyModel } from '../app/models/company.model';
import { IUserModel } from '../app/models/user.model';
import { IRequestModel } from '../request/models/request.model';
import { IIFile } from './file.interface';

export interface IRequestFile {
  _id: any;
  company: ICompanyModel;
  user: IUserModel;
  file: IIFile;
}
