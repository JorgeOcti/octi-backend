import {ICarrier} from "./carrier.interface";
import {ICarrierModel} from "../app/models/carrier.model";
import {IUser} from "./user.interface";
import {ITransmittal} from "./transmittal.interface";
import {ITransmittalModel} from "../distribution/models/transmittal.model";
import {IUserModel} from "../app/models/user.model";

export interface ITransmittalTransporter {
  transmittal: ITransmittal | ITransmittalModel;
  carrier: ICarrier | ICarrierModel;
  driver: IUser | IUserModel;
  patent: string;
}
