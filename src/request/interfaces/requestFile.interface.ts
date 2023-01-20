import type { ICompanyModel } from '../../app/models/company.model';
import type { IIFile } from '../../interfaces/file.interface';
import type { IUserModel } from '../../app/schemas/user.schema';

export interface IRequestFile {
  _id?: any;
  company: ICompanyModel;
  user: IUserModel;
  file: IIFile;
}
