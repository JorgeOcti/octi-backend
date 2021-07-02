import {ITeamModel} from "../app/models/team.model";
import {ITeam} from "./team.interface";
import {IVenueModel} from "../app/models/venue.model";
import {IUser} from "./user.interface";
import {ICarrier} from "./carrier.interface";
import {ICarrierModel} from "../app/models/carrier.model";

export interface ITransmittal {
  name: string;
  team: ITeamModel | ITeam;
  carrier: ICarrier | ICarrierModel;
  driver : IUser | IVenueModel;
  createdBy : IUser | IVenueModel;
}
