import {ITeam} from './team.interface';

export interface IReason {
  _id: any;
  name: string;
  team: ITeam;
}
