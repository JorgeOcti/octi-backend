import { ICompany } from '../../app/interfaces/company.interface';
import { IModule } from './module.interface';
import { ISubmodule } from './submodule.interface';
import { ITeam } from '../../app/interfaces/team.interface';

export interface ITeamBillingSection {
  _id?: any;
  name: string;
  start: number;
  end: number;
  price: number;
  text: string;
  order: number;
}

export interface ITeamBillingModules {
  _id?: any;
  module: IModule;
  subModules: ISubmodule[];
  sections: ITeamBillingSection[];
  active: boolean;
  updatedAt: Date;
  createdAt: Date;
}

export interface ITeamBillingNotification {
  _id?: any;
  name: string;
  email: string;
  active: boolean;
  updatedAt: Date;
  createdAt: Date;
}

export interface ITeamBilling {
  _id?: any;
  team: ITeam | any;
  name: string;
  rut: string;
  businessName: string;
  baseCost: number;
  textBaseCost: string;
  companies: ICompany[];
  modules: ITeamBillingModules[];
  notifications: ITeamBillingNotification[];
  updatedAt: Date;
  createdAt: Date;
}
