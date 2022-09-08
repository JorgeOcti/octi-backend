import { ICompany } from './company.interface';
import { IForm } from '../../form/interfaces/form.interface';
import { IPermission } from '../../billing/interfaces/permission.interface';

export interface IGroup {
  _id: any;
  name: string;
  company: ICompany;
  permissions: IPermission[];
  forms: IForm[];
  updatedAt: Date;
  createdAt: Date;
}
