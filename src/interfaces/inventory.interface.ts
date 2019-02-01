import {IUserModel} from '../app/models/user.model';
import {ICar} from './car.interface';
import {ICompany} from './company.interface';
import {IInventoryComment} from './inventoryComment.interface';
import {IInventoryFile} from './inventoryFile.interface';
import {IInventoryLabel} from './inventoryLabel.interface';
import {ITeam} from './team.interface';
import {IVenue} from './venue.interface';

export interface IInventoryCar {
  car: ICar;
  venue: IVenue;
  venueFound?: IVenue;
  comments: IInventoryComment[];
  label?: IInventoryLabel;
  labelText?: string;
  labelBy?: IUserModel;
  inventoriedBy?: IUserModel;
  images: IInventoryFile[];
  status?: string;
}

export interface IInventory {
  name: string;
  company: ICompany;
  team: ITeam;
  venues: IVenue[];
  cars: IInventoryCar[];
  createdBy: IUserModel;
  finalizedBy: IUserModel;
  finalizedAt: Date;
  status: string;
}
