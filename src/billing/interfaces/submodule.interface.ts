import { IModule } from './module.interface';

export interface ISubmodule {
  _id?: any;
  name: string;
  type: string;
  module: IModule;
  updatedAt: Date;
  createdAt: Date;
}
