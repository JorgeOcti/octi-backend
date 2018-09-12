import {IUserModel} from '../app/models/user.model';
import {IInventoryCarModel} from '../inventory/models/inventory.model';
import {ICar} from './car.interface';
import {ICompany} from './company.interface';
import {IVenue} from './venue.interface';

export interface IInventoryCar {
  car: ICar;
  venue: IVenue;
  venueFound?: IVenue;
  status?: string;
}

export interface IInventory {
  name: string;
  company: ICompany;
  venues: IVenue[];
  cars: IInventoryCarModel[];
  createdBy: IUserModel;
  finalizedBy: IUserModel;
  finalizedAt: Date;
  status: string;
}
