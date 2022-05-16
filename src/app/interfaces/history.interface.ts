import { ITeam } from './team.interface';
import { ModuleHistory, StatusHistory } from '../models/history.types';
import { IUser } from './user.interface';
import { ICar } from './car.interface';
import { IParticipant } from '../../form/interfaces';
import { IInventory, IInventoryCar } from '../../inventory/interfaces';
import { IVenue } from './venue.interface';
import { ICompany } from './company.interface';

export interface IHistory {
  _id: any;
  team: ITeam | string;
  company: ICompany | string;
  name: string,
  from: IVenue | string;
  to: IVenue | string;
  status: StatusHistory;
  module: ModuleHistory;
  current: boolean;
  car: ICar | string;
  createdBy: IUser | string;
  participant: IParticipant | string;
  inventory: IInventory | string;
  inventoryDetail: IInventoryCar | string;
  updatedAt: Date;
  createdAt: Date;
}
