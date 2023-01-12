import { ITeam } from '../../app/interfaces/team.interface';
import { ITeamModel } from '../../app/models/team.model';

export interface IPaymentMethod {
  _id?: any;
  name: string;
  team: ITeam | ITeamModel;
}
