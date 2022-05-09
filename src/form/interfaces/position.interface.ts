import {ITeam} from '../../app/interfaces/team.interface';

export interface IPosition {
  _id: any;
  name: string;
  team: ITeam | any;
}
