import { ITeamModel } from '../../app/models/team.model';
import { ITeam } from '../../app/interfaces/team.interface';

export interface IPaymentMethod {
  _id: any;
  name: string;
  team: ITeam | ITeamModel;
}
