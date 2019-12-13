import {ITeam} from './team.interface';

export interface IRequestStatus {
  _id: any;
  name: string;
  team: ITeam;
}
