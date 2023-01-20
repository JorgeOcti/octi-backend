import type { ICompany } from './company.interface';
import type { ITeam } from './team.interface';
import type { IUserModel } from "../schemas/user.schema";

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
