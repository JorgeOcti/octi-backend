import * as mongoose from 'mongoose';

import type { IDamageSelected, IDamages } from './damage.interface';
import type {
  IParticipantAccesoryModel,
  IParticipantAnswerModel,
  IParticipantChoicesModel,
  IParticipantDeliveryInfoModel,
  IParticipantItemModel,
  IParticipantSectionModel,
  IScaleParticipantModel
} from '../models/participant.model';

import type { ICarModel } from '../../app/models/car.model';
import type { ICarrierModel } from '../../app/models/carrier.model';
import type { ICompanyModel } from '../../app/models/company.model';
import type { IFormModel } from '../models/form.model';
import type { IMilestone } from '../../distribution/interfaces/milestone.interface';
import type { IMilestoneModel } from '../../distribution/models/milestone.model';
import type { IParticipantFile } from './participantFile.interface';
import type { ITeamModel } from '../../app/models/team.model';
import type { ITransmittal } from '../../distribution/interfaces/transmittal.interface';
import type { ITransmittalItem } from '../../distribution/interfaces/transmittalItem.interface';
import type { ITransmittalItemModel } from '../../distribution/models/transmittalItem.model';
import type { ITransmittalModel } from '../../distribution/models/transmittal.model';
import type { IUserModel } from '../../app/schemas/user.schema';
import type { IVenueModel } from '../../app/models/venue.model';

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
  _id?: any;
  item: string;
  amount: boolean;
}

export interface IParticipantAccesory {
  _id?: any;
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
  plateEvidence: IParticipantFile[];
}

export interface IParticipant {
  _id?: any;
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

  rawAnswers: Object;
  rawBody: Object;
  keyRawAnswers: string;

  imported: boolean;
  importedType: string;
  importedFrom: string;
  importedID: string;

  active: boolean;
  updatedAt: Date;
  createdAt: Date;
}
