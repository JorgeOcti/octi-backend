import {ITeam} from '../../app/interfaces/team.interface';

export interface IKind {
  _id: any;
  name: string;
  team: ITeam | any;
}
