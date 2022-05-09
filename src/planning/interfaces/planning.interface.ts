import {ITeam} from '../../app/interfaces/team.interface';
import {ICompany} from '../../app/interfaces/company.interface';
import {ICar} from '../../app/interfaces/car.interface';
import {IUser} from '../../app/interfaces/user.interface';

export interface IPlanning {
  _id: any;
  team: ITeam | any;
  company: ICompany | any;
  car: ICar | any;
  createdBy: IUser | any;
  date: Date;
}
