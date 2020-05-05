import {ITeam} from './team.interface';
import {ICompany} from './company.interface';
import {ICar} from './car.interface';
import {IUser} from './user.interface';

export interface IPlanning {
  _id: any;
  team: ITeam | any;
  company: ICompany | any;
  car: ICar | any;
  createdBy: IUser | any;
  date: Date;
}
