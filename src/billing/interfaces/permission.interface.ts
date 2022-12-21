import { ISubmodule } from './submodule.interface';

export interface IPermission {
  _id?: any;
  name: string;
  submdule: ISubmodule;
  codeName: string;
  updatedAt: Date;
  createdAt: Date;
}
