import {ITeam} from './team.interface';

export interface IBaseRegion {
  _id?: any;
  name: string;
  code: string;
}

export interface IRegion {
  _id: any;
  name: string;
  code: string;
  team: ITeam;
  updatedAt: Date;
  createdAt: Date;
}
