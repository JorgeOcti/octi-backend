import {ICompany} from './company.interface';
import {IForm} from './form.interface';
import {IPermission} from './permision.interface';

export interface IGroup {
  _id: any;
  name: string;
  company: ICompany;
  permissions: IPermission[];
  forms: IForm[];
  updatedAt: Date;
  createdAt: Date;
}
