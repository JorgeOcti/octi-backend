import { ITeamModel } from '../app/models/team.model';
import { ITeam } from './team.interface';

export interface ISalesChannel{
  name: string;
  team: ITeam | ITeamModel;
  fleet: boolean;
}