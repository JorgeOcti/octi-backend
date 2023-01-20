import type { IForm } from '../../form/interfaces/form.interface';
import type { IParticipant } from '../../form/interfaces/participant.interface';
import type { IInventory, IInventoryCar } from '../../inventory/interfaces/inventory.interface';
import type { ModuleHistory, StatusHistory } from '../models/history.types';
import type { ICar } from './car.interface';
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
