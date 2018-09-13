import {IUserModel} from '../app/models/user.model';
import {ICar} from './car.interface';
import {ICompany} from './company.interface';
import {IInventoryFile} from './inventoryFile.interface';
import {IVenue} from './venue.interface';

export interface IInventoryCar {
  car: ICar;
  venue: IVenue;
  venueFound?: IVenue;
  inventoriedBy?: IUserModel;
  images: IInventoryFile[];
  status?: string;
}

export interface IInventory {
  name: string;
  company: ICompany;
  venues: IVenue[];
  cars: IInventoryCar[];
  createdBy: IUserModel;
  finalizedBy: IUserModel;
  finalizedAt: Date;
  status: string;
}
