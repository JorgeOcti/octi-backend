import {ICar} from './car.interface';
import {ICompany} from './company.interface';

export interface IInventory {
  name: string;
  company: ICompany;
  cars: ICar[];
  carsFound: ICar[];
}
