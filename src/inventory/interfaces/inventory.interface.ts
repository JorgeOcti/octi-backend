import * as mongoose from 'mongoose';
import type { ICar } from '../../app/interfaces/car.interface';
import type { ICompany } from '../../app/interfaces/company.interface';
import type { ITeam } from '../../app/interfaces/team.interface';
import type { IVenue } from '../../app/interfaces/venue.interface';
import type { IUserModel } from '../../app/schemas/user.schema';
import type { IIFile } from '../../interfaces/file.interface';
import type { IInventoryComment } from './inventoryComment.interface';
import type { IInventoryFile } from './inventoryFile.interface';
import type { IInventoryLabel } from './inventoryLabel.interface';

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
  status: string;
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
