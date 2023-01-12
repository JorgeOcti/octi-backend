import {ICar} from "../../app/interfaces/car.interface";
import {ICarModel} from "../../app/models/car.model";
import {IParticipant} from "../../form/interfaces/participant.interface";
import {IParticipantModel} from "../../form/models/participant.model";
import {IRequest} from "../../request/interfaces/request.interface";
import {IRequestItem} from "../../request/interfaces/requestItem.interface";
import {IRequestItemModel} from "../../request/models/requestItem.model";
import {IRequestModel} from "../../request/models/request.model";
import {ITeam} from "../../app/interfaces/team.interface";
import {ITeamModel} from "../../app/models/team.model";
import {ITransmittal} from "./transmittal.interface";
import {ITransmittalModel} from "../models/transmittal.model";
import {IVenue} from "../../app/interfaces/venue.interface";
import {IVenueModel} from "../../app/models/venue.model";

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
