import { ITeam } from '../../app/interfaces/team.interface';

export interface IReasonQuestion {
  _id?: any;
  name: string;
  type: string;
  required: boolean;
}

export interface IReason {
  _id: any;
  name: string;
  team: ITeam;
  file: {
    active: boolean;
    required: boolean;
  };
  questions: IReasonQuestion[];
}
