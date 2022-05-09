import {ICompanyModel} from '../../app/models/company.model';
import {IUserModel} from '../../app/models/user.model';
import {IFormModel} from '../models/form.model';

interface IIFile {
  url: string;
  type: string;
  name: string;
  size: number;
}

export interface IParticipantFile {
  _id: any;
  form: IFormModel;
  company: ICompanyModel;
  user: IUserModel;
  file: IIFile;
}
