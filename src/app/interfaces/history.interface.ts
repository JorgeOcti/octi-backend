import { IForm, IParticipant } from '../../form/interfaces';
import { IInventory, IInventoryCar } from '../../inventory/interfaces';
import { ModuleHistory, StatusHistory } from '../models/history.types';

import { ICar } from './car.interface';
import { ICompany } from './company.interface';
import { ITeam } from './team.interface';
import { IUser } from './user.interface';
import { IVenue } from './venue.interface';

export interface IHistoryDamage {
  hasDamages: boolean
}

export interface IHistory {
  _id?: any;
  team: ITeam | any;
  company: ICompany | any;
  from: IVenue | any;
  to: IVenue | any;
  status: StatusHistory;
  module: ModuleHistory;
  changeLocation: boolean;
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
