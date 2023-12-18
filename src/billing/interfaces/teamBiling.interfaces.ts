import type { ICompany } from '../../app/interfaces/company.interface';
import type { IModule } from './module.interface';
import type { ISubmodule } from './submodule.interface';
import type { ITeam } from '../../app/interfaces/team.interface';

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

export interface IHistoryResults {
  countByModule: any;
  countBySubmodule: any;
  countByCompany: any;
  uniqueHistories: any[];
}

export interface IInvoiceData {
  histories: any,
  teamBilling: any,
  period: String,
  from: Date | undefined,
  to: Date | undefined,
  uniqueHistories: any,
  countByModule: any,
  countBySubmodule: any,
  countByCompany: any,
  totalDolar: number
}
