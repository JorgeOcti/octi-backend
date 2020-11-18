import { IRequestItemModel } from 'request/models/requestItem.model';
import { ICarModel } from '../app/models/car.model';
import { ITeamModel } from '../app/models/team.model';
import { IUserModel } from '../app/models/user.model';
import { IVenueModel } from '../app/models/venue.model';
import { IRequestStatusModel } from '../request/models/requestStatus.model';
import { ICar } from './car.interface';
import { IRequestStatus } from './requestStatus.interface';
import { ITeam } from './team.interface';
import { IUser } from './user.interface';
import { IVenue } from './venue.interface';

export interface IRequest {
  _id: any;
  number: number;
  car: ICar | ICarModel;
  team: ITeam | ITeamModel;
  createdBy: IUser | IUserModel;
  origin: IVenue | IVenueModel;
  destination: IVenue | IVenueModel;
  items: IRequestItemModel[];
  loadingDate: Date;
  arrivalDate: Date;
  fleet: boolean;
  status: IRequestStatus | IRequestStatusModel;
  updatedAt: Date;
  createdAt: Date;
}
