import {ICarrier} from "./carrier.interface";
import {ICarrierModel} from "../app/models/carrier.model";
import {IUser} from "./user.interface";
import {IVenueModel} from "../app/models/venue.model";
import {ITransmittal} from "./transmittal.interface";
import {ITransmittalModel} from "../distribution/models/transmittal.model";

export interface ITransmittalTransporter {
  transmittal: ITransmittal | ITransmittalModel;
  carrier: ICarrier | ICarrierModel;
  driver: IUser | IVenueModel;
  patent: string;
}
