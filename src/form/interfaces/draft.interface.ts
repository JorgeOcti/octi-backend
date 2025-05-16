import { ICar } from '../../app/interfaces/car.interface';
import { IVenue } from '../../app/interfaces/venue.interface';
import { IForm } from './form.interface';
import { IUser } from '../../app/interfaces/user.interface';

export interface IDraft {
  car: ICar | string,
  venue: IVenue | string,
  form: IForm | string,
  keys: string[],
  user: IUser | string,
  answers: any,
  createdAt: Date,
  updatedAt: Date
}
