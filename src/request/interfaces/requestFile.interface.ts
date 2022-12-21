import { ICompanyModel } from '../../app/models/company.model';
import { IIFile } from '../../interfaces/file.interface';
import { IUserModel } from '../../app/models/user.model';

export interface IRequestFile {
  _id?: any;
  company: ICompanyModel;
  user: IUserModel;
  file: IIFile;
}
