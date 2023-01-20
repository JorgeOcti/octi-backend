import type { ICar } from "../../app/interfaces/car.interface";
import type { ITeam } from "../../app/interfaces/team.interface";
import type { IVenue } from "../../app/interfaces/venue.interface";
import type { ICarModel } from "../../app/models/car.model";
import type { ITeamModel } from "../../app/models/team.model";
import type { IVenueModel } from "../../app/models/venue.model";
import type { IParticipant } from "../../form/interfaces/participant.interface";
import type { IParticipantModel } from "../../form/models/participant.model";
import type { IRequest } from "../../request/interfaces/request.interface";
import type { IRequestItem } from "../../request/interfaces/requestItem.interface";
import type { IRequestModel } from "../../request/models/request.model";
import type { IRequestItemModel } from "../../request/models/requestItem.model";
import type { ITransmittalModel } from "../models/transmittal.model";
import type { ITransmittal } from "./transmittal.interface";

export interface ITransmittalItem {
  _id?: any;
  transmittal: ITransmittal | ITransmittalModel;
  team: ITeam | ITeamModel;
  request: IRequest | IRequestModel;
  requestItem: IRequestItem | IRequestItemModel;
  car: ICar | ICarModel;
  destination: IVenue | IVenueModel;
  origin: IVenue | IVenueModel;
  revisions: IParticipant[] | IParticipantModel[];
  observation: string;
  loadingDate: Date;
  arrivalDate: Date;
}
