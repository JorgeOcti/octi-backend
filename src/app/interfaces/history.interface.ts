import { ITeam } from './team.interface';
import { ModuleHistory, StatusHistory } from '../models/history.types';
import { IUser } from './user.interface';
import { ICar } from './car.interface';
import { IForm, IParticipant } from '../../form/interfaces';
import { IInventory, IInventoryCar } from '../../inventory/interfaces';
import { IVenue } from './venue.interface';
import { ICompany } from './company.interface';

export interface IHistoryDamage {
  hasDamages: boolean
}

export interface IHistory {
  _id: any;
  team: ITeam | any;
  company: ICompany | any;
  from: IVenue | any;
  to: IVenue | any;
  status: StatusHistory;
  module: ModuleHistory;
  current: boolean;
  car: ICar | any;
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
