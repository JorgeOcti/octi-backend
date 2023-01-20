import type { ICarrier } from "../../app/interfaces/carrier.interface";
import type { IUser } from "../../app/interfaces/user.interface";
import type { ICarrierModel } from "../../app/models/carrier.model";
import type { IUserModel } from "../../app/schemas/user.schema";
import type { ITransmittalModel } from "../models/transmittal.model";
import type { ITransmittal } from "./transmittal.interface";

export interface ITransmittalTransporter {
  transmittal: ITransmittal | ITransmittalModel;
  carrier: ICarrier | ICarrierModel;
  driver: IUser | IUserModel;
  patent: string;
}
