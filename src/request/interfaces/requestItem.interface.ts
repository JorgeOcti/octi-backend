import { ICar } from '../../app/interfaces/car.interface';
import { ICarModel } from '../../app/models/car.model';
import { ICarrier } from '../../app/interfaces/carrier.interface';
import { ICarrierModel } from '../../app/models/carrier.model';
import { ICompany } from '../../app/interfaces';
import { ICompanyModel } from '../../app/models';
import { IReason } from './reason.interface';
import { IReasonModel } from '../models/reason.model';
import { IRequest } from './request.interface';
import { IRequestFile } from './requestFile.interface';
import { IRequestItemStatus } from './requestItemStatus.interface';
import { IRequestItemStatusModel } from '../models/requestItemStatus.model';
import { IRequestModel } from '../models/request.model';
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
