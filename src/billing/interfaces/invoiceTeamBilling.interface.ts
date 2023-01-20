import type { ICompany } from "../../app/interfaces/company.interface";
import type { IHistory } from "../../app/interfaces/history.interface";

import type { ITeam } from '../../app/interfaces/team.interface';
import type { IModule } from "./module.interface";
import type { ISubmodule } from "./submodule.interface";
import type { ITeamBilling } from "./teamBiling.interfaces";

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
  _id?: any;
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

  from?: Date;
  to?: Date;

  updatedAt?: Date;
  createdAt?: Date;
}
