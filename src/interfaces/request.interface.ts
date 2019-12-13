import {ICar} from "./car.interface";
import {ITeam} from "./team.interface";
import {IUser} from "./user.interface";
import {ITeamModel} from "../app/models/team.model";
import {IUserModel} from "../app/models/user.model";
import {ICarModel} from "../app/models/car.model";
import {IRequestStatus} from "./requestStatus.interface";
import {IRequestStatusModel} from "../request/models/requestStatus.model";
import {IVenue} from "./venue.interface";
import {IVenueModel} from "../app/models/venue.model";

export interface IRequest {
  number: Number;
  car: ICar | ICarModel;
  team: ITeam | ITeamModel;
  createdBy: IUser | IUserModel;
  origin: IVenue | IVenueModel;
  destination: IVenue | IVenueModel;
  loadingDate: Date;
  arrivalDate: Date;
  fleet: Boolean;
  status: IRequestStatus | IRequestStatusModel;
  updatedAt: Date;
  createdAt: Date;
}
