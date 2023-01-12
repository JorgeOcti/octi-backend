import {ICompany} from './company.interface';
import {ITeam} from './team.interface';
import {IUserModel} from "../models/user.model";

export interface IAlert {
  _id?: any;
  name: string;
  company: ICompany | any;
  team: ITeam | any;
  users: IUserModel[];
  gte: number;
  lte: number;
  updatedAt: Date;
  createdAt: Date;
}
