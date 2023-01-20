import type { ITeam } from '../../app/interfaces/team.interface';
import type { ITeamModel } from '../../app/models/team.model';

export interface IMilestoneType {
  _id?: any;
  team: ITeam | ITeamModel;
  name: string;
  needMarkBorder: boolean;
}
