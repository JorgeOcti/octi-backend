import {ITeam} from '../../app/interfaces/team.interface';
import {IUser} from "../../app/interfaces/user.interface";

export interface IStudio {
  _id: any;
  team: ITeam;
  name: string;
  embedURL: string;
  type: string;
  users: IUser[];
  updatedAt?: Date;
  createdAt?: Date;
}

