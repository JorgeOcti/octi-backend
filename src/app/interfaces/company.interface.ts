import { ITeam } from './team.interface';
import { IUser } from './user.interface';

export interface IBillingCompany {
  active: boolean;
  checklistPrice: number;
  inventoryPrice: number;
  requestPrice: number;
}

export interface IBillingNotifications {
  _id?: any;
  tempID?: any;
  name: string;
  email: string;
}

export interface IBaseCompany {
  _id?: any;
  name: string;
  businessName: string;
  rut: string;
  image: any;
  imageURI?: string | null;
  marker: any;
  markerURI?: string | null;
  billing: IBillingCompany;
  notifications: IBillingNotifications[];
}

export interface ICompany extends IBaseCompany {
  _id: any;
  users?: IUser[];
  team: ITeam;
  active: boolean;
  deleted: boolean;
  updatedAt: Date;
  createdAt: Date;
  iFrameURL: string;
  iFrameURLInventory: string;
}
