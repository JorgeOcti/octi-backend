import { ICar } from '../../app/interfaces/car.interface';
import { ICarModel } from '../../app/models/car.model';
import { ICompany } from '../../app/interfaces';
import { ICompanyModel } from '../../app/models';
import { IOperationType } from './operationType.interface';
import { IOperationTypeModel } from '../models/operationType.model';
import { IRequestFile } from './requestFile.interface';
import { IRequestItem } from './requestItem.interface';
import { IRequestStatus } from './requestStatus.interface';
import { IRequestStatusModel } from '../models/requestStatus.model';
import { ISalesChannel } from './salesChannel.interface';
import { ISalesChannelModel } from '../models/salesChannel.model';
import { ITeam } from '../../app/interfaces/team.interface';
import { ITeamModel } from '../../app/models/team.model';
import { ITransmittal } from '../../distribution/interfaces/transmittal.interface';
import { ITransmittalItem } from '../../distribution/interfaces/transmittalItem.interface';
import { ITransmittalItemModel } from '../../distribution/models/transmittalItem.model';
import { ITransmittalModel } from '../../distribution/models/transmittal.model';
import { IUser } from '../../app/interfaces/user.interface';
import { IUserModel } from '../../app/models/user.model';
import { IVenue } from '../../app/interfaces/venue.interface';
import { IVenueModel } from '../../app/models/venue.model';

export interface IRequestCustomer {
  name: string;
  rut: string;
  email: string;
  phone: string;
}

export interface IRequestAdvancePayment {
  method: string;
  otherMethod: string;
  number: string;
  files: IRequestFile[];
  letters: IRequestFile[];
}

export interface IRequest {
  _id?: any;
  number: number;
  car: ICar | ICarModel;
  team: ITeam | ITeamModel;
  company: ICompanyModel | ICompany
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
  conectaID: string;
  deliveryVenue: IVenue | IVenueModel;
  deliveryAddress: string;
  deliveryDate: Date;
  updatedAt: Date;
  createdAt: Date;
}
