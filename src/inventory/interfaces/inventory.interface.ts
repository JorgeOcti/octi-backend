import * as mongoose from 'mongoose';
import { IUserModel } from '../../app/models/user.model';
import { ICar } from '../../app/interfaces/car.interface';
import { ICompany } from '../../app/interfaces/company.interface';
import { IIFile } from '../../interfaces/file.interface';
import { IInventoryComment } from './inventoryComment.interface';
import { IInventoryFile } from './inventoryFile.interface';
import { IInventoryLabel } from './inventoryLabel.interface';
import { ITeam } from '../../app/interfaces/team.interface';
import { IVenue } from '../../app/interfaces/venue.interface';

export interface IInventoryCar {
  car: ICar;
  inventory?: mongoose.Schema.Types.ObjectId;
  venue: IVenue;
  venueFound?: IVenue;
  comments: IInventoryComment[];
  label?: IInventoryLabel;
  labelText?: string;
  deletedBy?: IUserModel;
  labelBy?: IUserModel;
  inventoriedBy?: IUserModel;
  images: IInventoryFile[];
  files: IInventoryFile[];
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
  file: IIFile;
  backup: IIFile;
  status: string;
  updatedAt: Date;
  createdAt: Date;
}
