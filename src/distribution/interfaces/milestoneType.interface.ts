import { ITeam } from '../../app/interfaces/team.interface';
import { ITeamModel } from '../../app/models/team.model';

export interface IMilestoneType {
  _id: any;
  team: ITeam | ITeamModel;
  name: string;
}
