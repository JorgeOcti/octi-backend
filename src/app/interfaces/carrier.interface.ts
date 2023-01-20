import type { ITeam } from './team.interface';

export interface IBaseCarrier {
  _id?: any;
  name: string;
}

export interface ICarrier extends IBaseCarrier {
  _id?: any;
  team: ITeam;
  updatedAt: Date;
  createdAt: Date;
}
