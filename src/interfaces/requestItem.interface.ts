import {ICar} from "./car.interface";
import {ICarModel} from "../app/models/car.model";
import {IReason} from "./reason.interface";
import {IReasonModel} from "../request/models/reason.model";
import {IVenue} from "./venue.interface";
import {IVenueModel} from "../app/models/venue.model";
import {ITeam} from "./team.interface";
import {ITeamModel} from "../app/models/team.model";
import {IUser} from "./user.interface";
import {IUserModel} from "../app/models/user.model";
import {IRequest} from "./request.interface";
import {IRequestModel} from "../request/models/request.model";

export interface IRequestItem {
  request: IRequest | IRequestModel;
  team: ITeam | ITeamModel;
  origin: IVenue | IVenueModel;
  position: IVenue | IVenueModel;
  destination: IVenue | IVenueModel;
  car: ICar | ICarModel;
  reason: IReason | IReasonModel;
  observation: string;
  equipment: boolean;
  washed: boolean;
  review: boolean;
  body: boolean;
  createdBy: IUser | IUserModel;
}
