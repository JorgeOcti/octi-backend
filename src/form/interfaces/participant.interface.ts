import * as mongoose from 'mongoose';

import { IDamageSelected, IDamages } from './damage.interface';
import {
  IParticipantAccesoryModel,
  IParticipantAnswerModel,
  IParticipantChoicesModel,
  IParticipantDeliveryInfoModel,
  IParticipantItemModel,
  IParticipantSectionModel,
  IScaleParticipantModel
} from '../models/participant.model';

import { ICarModel } from '../../app/models/car.model';
import { ICarrierModel } from '../../app/models/carrier.model';
import { ICompanyModel } from '../../app/models/company.model';
import { IFormModel } from '../models/form.model';
import { IMilestone } from '../../distribution/interfaces';
import { IMilestoneModel } from '../../distribution/models/milestone.model';
import { IParticipantFile } from './participantFile.interface';
import { ITeamModel } from '../../app/models/team.model';
import { ITransmittal } from '../../distribution/interfaces/transmittal.interface';
import { ITransmittalItem } from '../../distribution/interfaces/transmittalItem.interface';
import { ITransmittalItemModel } from '../../distribution/models/transmittalItem.model';
import { ITransmittalModel } from '../../distribution/models/transmittal.model';
import { IUserModel } from '../../app/models/user.model';
import { IVenueModel } from '../../app/models/venue.model';

export interface IParticipantChoices {
  choice: string;
  value: number;
  backgroundColor: string;
  requireImage: boolean;
  requireComment: boolean;
  requireAccesories: boolean;
  requireConciliation: boolean;
  na: boolean;
  order: number;
}

export interface IParticipantScale {
  name: string;
  minValue: number;
  maxValue: number;
  choices: mongoose.Types.Array<IParticipantChoicesModel>;
  active: boolean;
}

export interface IParticipantItems {
  _id: any;
  item: string;
  amount: boolean;
}

export interface IParticipantAccesory {
  _id: any;
  question: string;
  items: IParticipantItemModel[];
}

export interface IParticipantAnswer {
  question: string;
  kindUpdate: string;
  shortName: string;

  scale: IScaleParticipantModel;

  damages: IDamages;
  damagesSelected: IDamageSelected[];

  accessories: IParticipantAccesoryModel;
  accesoriesSelected: any[];
  accesoriesAnswered: any[];
  conciliation: boolean;

  answer: string;
  images: IParticipantFile[];
  qualification: number;
  comment: string;
  na: boolean;

  risk: string;
  observe: string;

  weight: number;
  kind: string;
  order: number;

  hint: string;
  optional: boolean;

  minValue: number;
  maxValue: number;
  colors: string[];
  score: number;

  requireSeverity: boolean;

}

export interface IParticipantSection {
  name: string;
  shortName: string;

  answers: mongoose.Types.Array<IParticipantAnswerModel>;

  qualification: number;
  weight: number;
  order: number;
}

export interface IParticipantDeliveryInfo {
  name: string;
  email: string;
  rut: string;
  order: string;
  signature: IParticipantFile[];
  identifyCard: IParticipantFile[];
}

export interface IParticipant {
  _id: any;
  number: number;
  name: string;

  form: IFormModel;
  team: ITeamModel;
  company: ICompanyModel;

  user: IUserModel;
  venue: IVenueModel;
  car: ICarModel;

  description: string;

  sections: mongoose.Types.Array<IParticipantSectionModel>;
  hasDamages: boolean;

  qualification: number;

  kind: string;

  shipping: boolean;
  shippingText: string;
  shippingImages: IParticipantFile[];
  shippingConfirmation: boolean;
  shippingVenue: boolean;
  shippingVenueText: string;
  sendTo: IVenueModel;

  reception: boolean;
  receptionText: string;
  receptionImages: IParticipantFile[];
  receptionConfirmation: boolean;
  receptionVenue: boolean;
  receptionVenueText: string;
  receiveFrom: IVenueModel;

  carrier: boolean;
  carrierText: string;
  carrierBy: ICarrierModel;

  conciliation: boolean;
  conciliationText: string;
  conciliationImages: IParticipantFile[];

  transmittalItem?: ITransmittalItem | ITransmittalItemModel;

  transmittal?: ITransmittal | ITransmittalModel;
  milestone?: IMilestone | IMilestoneModel;

  deliveryToCustomer: boolean;
  deliveryInfo: IParticipantDeliveryInfo | IParticipantDeliveryInfoModel;

  imported: boolean;
  active: boolean;
  imported: boolean;
  updatedAt: Date;
  createdAt: Date;
}
