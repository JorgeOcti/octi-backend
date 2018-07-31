import {ICompany} from './company.interface';
import {IUser} from './user.interface';

export interface IAlert {
  _id: any;
  name: string;
  company: ICompany | any;
  users: IUser[];
  gte: number;
  lte: number;
  updatedAt: Date;
  createdAt: Date;
}
