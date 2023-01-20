import type { ITeam } from '../../app/interfaces/team.interface';

export interface IOperationType {
  _id?: any;
  name: string;
  team: ITeam;
}
