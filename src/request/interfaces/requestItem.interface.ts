import { ICarrierModel } from '../../app/models/carrier.model';
import { ICarModel } from '../../app/models/car.model';
import { ITeamModel } from '../../app/models/team.model';
import { IUserModel } from '../../app/models/user.model';
import { IVenueModel } from '../../app/models/venue.model';
import { IReasonModel } from '../models/reason.model';
import { IRequestModel } from '../models/request.model';
import { ICar } from '../../app/interfaces/car.interface';
import { ICarrier } from '../../app/interfaces/carrier.interface';
import { IReason } from './reason.interface';
import { IRequest } from './request.interface';
import { IRequestItemStatus } from './requestItemStatus.interface';
import { ITeam } from '../../app/interfaces/team.interface';
import { IUser } from '../../app/interfaces/user.interface';
import { IVenue } from '../../app/interfaces/venue.interface';
import { IRequestFile } from './requestFile.interface';
import { IRequestItemStatusModel } from '../models/requestItemStatus.model';
import { ITransmittal } from '../../distribution/interfaces/transmittal.interface';
import { ITransmittalModel } from '../../distribution/models/transmittal.model';
import { ITransmittalItem } from '../../distribution/interfaces/transmittalItem.interface';
import { ITransmittalItemModel } from '../../distribution/models/transmittalItem.model';

export interface IRequestAnswer {
  questionId: any;
  question: string;
  answer: string;
}

export interface IRequestItem {
  _id: any;
  request: IRequest | IRequestModel;
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
  team: ITeam | ITeamModel;
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
