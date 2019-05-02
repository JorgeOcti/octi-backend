import {ITeam} from './team.interface';

export interface IRegion {
  _id: any;
  name: string;
  team: ITeam;
}
