import {IUser} from './user.interface';

export interface ITeam {
  _id: any;
  name: string;
  formsNumber: number;
  active: boolean;
  users?: IUser[];
  updatedAt: Date;
  createdAt: Date;
}
