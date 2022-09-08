import {ITeam} from '../../app/interfaces/team.interface';
import {ITeamBilling} from "./teamBiling.interfaces";
import {ICompany, IHistory} from "../../app/interfaces";
import {IModule} from "./module.interface";
import {ISubmodule} from "./submodule.interface";


interface IIFile {
  url: string;
  type: string;
  name: string;
  size: number;
}


interface IInvoiceTeamBillingModule {
  module: IModule;
  histories: IHistory[];
}

interface IInvoiceTeamBillingSubModule {
  subModule: ISubmodule;
  histories: IHistory[];
}

interface IInvoiceTeamBillingCompany {
  company: ICompany;
  histories: IHistory[];
}

export interface IInvoiceTeamBilling {
  _id: any;
  team: ITeam;
  period: string;
  teamBilling: ITeamBilling;

  modules: IInvoiceTeamBillingModule[];
  subModules: IInvoiceTeamBillingSubModule[];
  companies: IInvoiceTeamBillingCompany[];

  histories: IHistory[];
  uniqueHistories: IHistory[];

  total: number;
  realDolar: number;
  totalDolar: number;

  totalUF: number;
  totalPeso: number;
  valueUF: number;
  valueDolar: number;

  file: IIFile;

  updatedAt?: Date;
  createdAt?: Date;
}
