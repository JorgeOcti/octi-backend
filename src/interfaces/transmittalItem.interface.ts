import {ITransmittal} from "./transmittal.interface";
import {ITransmittalModel} from "../distribution/models/transmittal.model";
import {IVenue} from "./venue.interface";
import {IVenueModel} from "../app/models/venue.model";
import {ICar} from "./car.interface";
import {ICarModel} from "../app/models/car.model";
import {IRequestItemModel} from "../request/models/requestItem.model";
import {IRequestItem} from "./requestItem.interface";
import {IRequest} from "./request.interface";
import {IRequestModel} from "../request/models/request.model";

export interface ITransmittalItem {
  transmittal: ITransmittal | ITransmittalModel;
  request: IRequest | IRequestModel;
  requestItem: IRequestItem | IRequestItemModel;
  car: ICar | ICarModel;
  destination: IVenue | IVenueModel;
  origin: IVenue | IVenueModel;
  loadingDate: Date;
  arrivalDate: Date;
}
