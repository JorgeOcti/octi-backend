import * as mongoose from 'mongoose';
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
  inventory?: mongoose.Schema.Types.ObjectId;
  venue: IVenue;
  venueFound?: IVenue;
  comments: IInventoryComment[];
  label?: IInventoryLabel;
  labelText?: string;
  labelBy?: IUserModel;
  inventoriedBy?: IUserModel;
  images: IInventoryFile[];
  status?: string;
  updatedAt?: Date;
  createdAt?: Date;
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
  file: any;
  updatedAt: Date;
  createdAt: Date;
}
