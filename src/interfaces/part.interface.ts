import {ITeam} from './team.interface';

export interface IPart {
  _id: any;
  name: string;
  team: ITeam | any;
}
