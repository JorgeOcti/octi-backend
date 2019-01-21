import {ICompany} from './company.interface';
import {ITeam} from './team.interface';
import {IUser} from './user.interface';

export interface IAlert {
  _id: any;
  name: string;
  company: ICompany | any;
  team: ITeam | any;
  users: IUser[];
  gte: number;
  lte: number;
  updatedAt: Date;
  createdAt: Date;
}
