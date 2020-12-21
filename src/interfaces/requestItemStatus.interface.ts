import {ITeam} from './team.interface';

export interface IRequestItemStatus {
  _id: any | string;
  name: string;
  team: ITeam;
  weigth: number;
  default: boolean;
}
