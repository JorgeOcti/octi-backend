import {ITeam} from '../../app/interfaces/team.interface';

export interface IRequestStatus {
  _id?: any;
  name: string;
  weigth: number;
  team: ITeam;
  default: boolean;
}
