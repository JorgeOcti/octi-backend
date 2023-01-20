import type { ICar } from '../../app/interfaces/car.interface';
import type { ICarModel } from '../../app/models/car.model';
import type { ICompany } from '../../app/interfaces/company.interface';
import type { ICompanyModel } from '../../app/models/company.model';
import type { IOperationType } from './operationType.interface';
import type { IOperationTypeModel } from '../models/operationType.model';
import type { IRequestFile } from './requestFile.interface';
import type { IRequestItem } from './requestItem.interface';
import type { IRequestStatus } from './requestStatus.interface';
import type { IRequestStatusModel } from '../models/requestStatus.model';
import type { ISalesChannel } from './salesChannel.interface';
import type { ISalesChannelModel } from '../models/salesChannel.model';
import type { ITeam } from '../../app/interfaces/team.interface';
import type { ITeamModel } from '../../app/models/team.model';
import type { ITransmittal } from '../../distribution/interfaces/transmittal.interface';
import type { ITransmittalItem } from '../../distribution/interfaces/transmittalItem.interface';
import type { ITransmittalItemModel } from '../../distribution/models/transmittalItem.model';
import type { ITransmittalModel } from '../../distribution/models/transmittal.model';
import type { IUser } from '../../app/interfaces/user.interface';
import type { IUserModel } from '../../app/schemas/user.schema';
import type { IVenue } from '../../app/interfaces/venue.interface';
import type { IVenueModel } from '../../app/models/venue.model';

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
