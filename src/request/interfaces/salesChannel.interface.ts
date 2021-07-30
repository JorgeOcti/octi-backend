import { ITeamModel } from '../../app/models/team.model';
import { ITeam } from '../../app/interfaces/team.interface';

export interface ISalesChannel {
  _id: any;
  name: string;
  team: ITeam | ITeamModel;
  fleet: boolean;
}
