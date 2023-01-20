import type { ICar } from '../../app/interfaces/car.interface';
import type { ICarModel } from '../../app/models/car.model';
import type { ICarrier } from '../../app/interfaces/carrier.interface';
import type { ICarrierModel } from '../../app/models/carrier.model';
import type { ICompany } from '../../app/interfaces/company.interface';
import type { ICompanyModel } from '../../app/models/company.model';
import type { IReason } from './reason.interface';
import type { IReasonModel } from '../models/reason.model';
import type { IRequest } from './request.interface';
import type { IRequestFile } from './requestFile.interface';
import type { IRequestItemStatus } from './requestItemStatus.interface';
import type { IRequestItemStatusModel } from '../models/requestItemStatus.model';
import type { IRequestModel } from '../models/request.model';
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

export interface IRequestAnswer {
  questionId: any;
  question: string;
  answer: string;
}

export interface IRequestItem {
  _id?: any;
  request: IRequest | IRequestModel;
  team: ITeam | ITeamModel;
  company: ICompanyModel | ICompany
  code: string;
  order: number;
  transmittal: ITransmittal | ITransmittalModel;
  transmittalItem: ITransmittalItem | ITransmittalItemModel;
  assigned: boolean;
  meta: {
    user: IUser;
    request: IRequest;
    car: ICar;
    origin: IVenue;
    destination: IVenue;
    status: IRequestItemStatus;
  };
  origin: IVenue | IVenueModel;
  position: IVenue | IVenueModel;
  destination: IVenue | IVenueModel;
  answers: IRequestAnswer[];
  car: ICar | ICarModel;
  files: IRequestFile[];
  carrier: ICarrier | ICarrierModel | any;
  reason: IReason | IReasonModel;
  status: IRequestItemStatus | IRequestItemStatusModel;
  priority: boolean;
  observation: string;
  equipment: boolean;
  washed: boolean;
  review: boolean;
  body: boolean;
  uploadDate?: Date;
  estimatedArrival?: Date;
  createdBy: IUser | IUserModel;
}
