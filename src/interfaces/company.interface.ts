import {ITeam} from './team.interface';
import {IUser} from './user.interface';

export interface IBaseCompany {
  _id?: any;
  name: string;
  image: any;
  imageURI?: string | null;
}

export interface ICompany extends IBaseCompany {
  _id: any;
  users?: IUser[];
  team: ITeam;
  active: boolean;
  deleted: boolean;
  updatedAt: Date;
  createdAt: Date;
}
