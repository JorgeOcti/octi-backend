import {ITeam} from './team.interface';

export interface IKind {
  _id: any;
  name: string;
  team: ITeam | any;
}
