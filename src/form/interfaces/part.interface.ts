import type { ITeam } from '../../app/interfaces/team.interface';

export interface IPart {
  _id?: any;
  name: string;
  team: ITeam | any;
}
