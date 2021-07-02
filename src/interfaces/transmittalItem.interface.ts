import {ITransmittal} from "./transmittal.interface";
import {ITransmittalModel} from "../distribution/models/transmittal.model";
import {IVenue} from "./venue.interface";
import {IVenueModel} from "../app/models/venue.model";
import {ICar} from "./car.interface";
import {ICarModel} from "../app/models/car.model";
import {IRequestItemModel} from "../request/models/requestItem.model";
import {IRequestItem} from "./requestItem.interface";

export interface ITransmittalItem {
  transmittal: ITransmittal | ITransmittalModel;
  invoice: string;
  entry: string;
  requestItem: IRequestItem | IRequestItemModel;
  destination: IVenue | IVenueModel;
  origin: IVenue | IVenueModel;
  car: ICar | ICarModel;
}
