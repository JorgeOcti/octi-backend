import { ICarModel } from '../../app/models/car.model';
import { ITeamModel } from '../../app/models/team.model';
import { IUserModel } from '../../app/models/user.model';
import { IVenueModel } from '../../app/models/venue.model';
import { IRequestStatusModel } from '../models/requestStatus.model';
import { ISalesChannelModel } from '../models/salesChannel.model';
import { ICar } from '../../app/interfaces/car.interface';
import { IRequestItem } from './requestItem.interface';
import { IRequestStatus } from './requestStatus.interface';
import { ISalesChannel } from './salesChannel.interface';
import { ITeam } from '../../app/interfaces/team.interface';
import { IUser } from '../../app/interfaces/user.interface';
import { IVenue } from '../../app/interfaces/venue.interface';
import { ITransmittalModel } from '../../distribution/models/transmittal.model';
import { ITransmittal } from '../../distribution/interfaces/transmittal.interface';
import { ITransmittalItemModel } from '../../distribution/models/transmittalItem.model';
import { ITransmittalItem } from '../../distribution/interfaces/transmittalItem.interface';
import { IOperationType } from './operationType.interface';
import { IOperationTypeModel } from '../models/operationType.model';
import { IRequestFile } from './requestFile.interface';

export interface IRequestCustomer {
  name: string;
  rut: string;
  email: string;
  phone: string;
}

export interface IRequestAdvancePayment {
  method: string;
  number: string;
  files: IRequestFile[];
}

export interface IRequest {
  _id: any;
  number: number;
  car: ICar | ICarModel;
  team: ITeam | ITeamModel;
  createdBy: IUser | IUserModel;
  origin: IVenue | IVenueModel;
  destination: IVenue | IVenueModel;
  items: IRequestItem[];
  sellerText: string;
  loadingDate: Date;
  arrivalDate: Date;
  channel: ISalesChannel | ISalesChannelModel;
  operationType: IOperationType | IOperationTypeModel;
  transmital?: ITransmittalModel | ITransmittal;
  transmitalItem?: ITransmittalItemModel | ITransmittalItem;
  fleet: boolean;
  status: IRequestStatus | IRequestStatusModel;
  customerInformation: IRequestCustomer;
  advancePaymentInformation: IRequestAdvancePayment;
  updatedAt: Date;
  createdAt: Date;
}
