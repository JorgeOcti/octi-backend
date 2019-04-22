import {ITeam} from './team.interface';

export interface IPosition {
  _id: any;
  name: string;
  team: ITeam | any;
}
