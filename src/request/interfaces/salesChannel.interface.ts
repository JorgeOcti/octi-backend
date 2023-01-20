import type { ITeam } from '../../app/interfaces/team.interface';
import type { ITeamModel } from '../../app/models/team.model';

export interface ISalesChannel {
  _id?: any;
  name: string;
  team: ITeam | ITeamModel;
  fleet: boolean;
}
