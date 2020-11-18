import {ITeam} from './team.interface';

export interface IRequestItemStatus {
  _id: any;
  name: string;
  team: ITeam;
  default: boolean;
}
