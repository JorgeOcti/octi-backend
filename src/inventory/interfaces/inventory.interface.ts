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
import { IVirtualInventory } from './virtualInventory.interface';
import { IForm } from '../../form/interfaces/form.interface';
import { IParticipant } from '../../form/interfaces/participant.interface';

export type MessageType = "VEHICLE_FOUND" | "CONTAINER_FOUND" | "EVIDENCE_ADDED" | "UNIT_ADDED" | "CONTAINER_CLOSED" | "CONTAINER_OPENED";

export interface IStatusEvidence {
  status: string;
  images: IInventoryFile[];
  date: Date;
}

export interface IInventoryCarContent {
  description: string;
  participant: mongoose.Schema.Types.ObjectId;
  content: any[];
  images: mongoose.Schema.Types.ObjectId[];
}

export interface IContentDetail {
  code: string;
  item: string;
  quantity: number;
  extra: any;
}

export interface IInventoryCar {
  car: ICar;
  inventory?: mongoose.Schema.Types.ObjectId | IInventory;
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
  containerStatus: string;
  container?: mongoose.Schema.Types.ObjectId;
  containerFound?: mongoose.Schema.Types.ObjectId;
  evidenceStatus: IStatusEvidence[];
  extra: any;
  virtualInventory?: mongoose.Schema.Types.ObjectId;
  participant?: IParticipant;
  contentDescription?: string;
  contentDetails?: IContentDetail[];
  units?: IInventoryCarContent[];
  openParticipant?: mongoose.Schema.Types.ObjectId;
  closeParticipant?: mongoose.Schema.Types.ObjectId;
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
  containerInventory: boolean;
  virtual: boolean;
  virtualInventories: IVirtualInventory[];
  unitForm?: IForm;
  contentForm?: IForm;
  finishForm?: IForm;
  openForm?: IForm;
  contentType: string;
  updatedAt: Date;
  createdAt: Date;
}
