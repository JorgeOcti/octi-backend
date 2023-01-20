import type { ICar } from '../../app/interfaces/car.interface';
import type { ICompany } from '../../app/interfaces/company.interface';
import type { ITeam } from '../../app/interfaces/team.interface';
import type { IUser } from '../../app/interfaces/user.interface';

export interface IPlanning {
  _id?: any;
  team: ITeam | any;
  company: ICompany | any;
  car: ICar | any;
  createdBy: IUser | any;
  date: Date;
}
