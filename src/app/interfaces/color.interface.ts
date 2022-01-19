import { ITeam } from './team.interface';

export interface IColor {
  _id: any;
  name: string,
  team: ITeam;
  updatedAt: Date;
  createdAt: Date;
}
