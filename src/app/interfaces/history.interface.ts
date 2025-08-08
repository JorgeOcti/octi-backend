import type { IForm } from '../../form/interfaces/form.interface';
import type { IParticipant } from '../../form/interfaces/participant.interface';
import type { IInventory, IInventoryCar } from '../../inventory/interfaces/inventory.interface';
import type { ModuleHistory, StatusHistory } from '../models/history.types';
import type { ICar } from './car.interface';
import { ICode } from './code.interface';
import type { ICompany } from './company.interface';
import type { ITeam } from './team.interface';
import type { IUser } from './user.interface';
import type { IVenue } from './venue.interface';

export interface IHistoryDamage {
  hasDamages: boolean
}

export interface IHistory {
  _id?: any;
  team: ITeam | any;
  company: ICompany | any;
  handlerCompany: ICompany | any;
  from: IVenue | any;
  to: IVenue | any;
  status: StatusHistory;
  module: ModuleHistory;
  changeLocation: boolean;
  current: boolean;
  car: ICar | any;
  code: ICode | any;
  createdBy: IUser | any;
  form: IForm | any;
  participant: IParticipant | any;
  inventory: IInventory | any;
  inventoryCar: IInventoryCar | any;
  executedAt: Date;
  alert: IHistoryDamage;
  alerts: IHistoryDamage[];
  updatedAt: Date;
  createdAt: Date;
}

export interface EventItem {
  _id: string;
  executedAt: string; // o Date si ya parseas la fecha
  status: string;
  className: string;
  title: string;
  text: string;
  color: string;
  icon: string;
  step: string;
  from: {
    name: string;
  };
  to: {
    name: string;
  };
  participant: {
    name: string;
    status: string;
    hasDamages: boolean;
    company: string;
    form: {
      name: string;
      action: string;
    };
    venue: {
      name: string;
    };
    createdAt: string; // o Date
  };
  createdBy: {
    firstName: string;
    lastName: string;
  };
}

export interface GroupedEvents {
  [label: string]: EventItem[];
}
