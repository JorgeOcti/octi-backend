import { ICarrierModel } from 'app/models/carrier.model';
import { ICarModel } from '../app/models/car.model';
import { ITeamModel } from '../app/models/team.model';
import { IUserModel } from '../app/models/user.model';
import { IVenueModel } from '../app/models/venue.model';
import { IReasonModel } from '../request/models/reason.model';
import { IRequestModel } from '../request/models/request.model';
import { ICar } from './car.interface';
import { ICarrier } from './carrier.interface';
import { IReason } from './reason.interface';
import { IRequest } from './request.interface';
import { ITeam } from './team.interface';
import { IUser } from './user.interface';
import { IVenue } from './venue.interface';

export interface IRequestItem {
  request: IRequest | IRequestModel;
  team: ITeam | ITeamModel;
  origin: IVenue | IVenueModel;
  position: IVenue | IVenueModel;
  destination: IVenue | IVenueModel;
  car: ICar | ICarModel;
  carrier: ICarrier | ICarrierModel;
  reason: IReason | IReasonModel;
  priority: boolean;
  observation: string;
  equipment: boolean;
  washed: boolean;
  review: boolean;
  body: boolean;
  createdBy: IUser | IUserModel;
}
