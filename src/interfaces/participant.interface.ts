import * as mongoose from 'mongoose';
import {ICarModel} from '../app/models/car.model';
import {ICompanyModel} from '../app/models/company.model';
import {ITeamModel} from '../app/models/team.model';
import {IUserModel} from '../app/models/user.model';
import {IVenueModel} from '../app/models/venue.model';
import {IFormModel} from '../form/models/form.model';
import {
  IParticipantAccesoryModel,
  IParticipantAnswerModel,
  IParticipantChoicesModel,
  IParticipantItemModel,
  IParticipantSectionModel,
  IScaleParticipantModel
} from '../form/models/participant.model';
import {IParticipantFile} from './participantFile.interface';

export interface IParticipantChoices {
  choice: string;
  value: number;
  backgroundColor: string;
  requireImage: boolean;
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

export interface IparticipantItems {
  _id: any;
  item: string;
}

export interface IparticipantAccesory {
  _id: any;
  question: string;
  items: IParticipantItemModel[];
}

export interface IParticipantAnswer {
  question: string;
  shortName: string;

  scale: IScaleParticipantModel;

  accessories: IParticipantAccesoryModel;
  accesoriesSelected: any[];
  conciliation: boolean;

  answer: string;
  images: IParticipantFile[];
  qualification: number;
  comment: string;
  na: boolean;

  risk: string;
  observe: string;

  weight: number;
  order: number;
}

export interface IParticipantSection {
  name: string;
  shortName: string;

  answers: mongoose.Types.Array<IParticipantAnswerModel>;

  qualification: number;
  weight: number;
  order: number;
}

export interface IParticipant {
  _id: any;
  name: string;

  form: IFormModel;
  team: ITeamModel;
  company: ICompanyModel;

  user: IUserModel;
  venue: IVenueModel;
  car: ICarModel;

  description: string;

  sections: mongoose.Types.Array<IParticipantSectionModel>;

  qualification: number;

  shipping: boolean;
  shippingText: string;
  shippingImages: IParticipantFile[];
  shippingVenue: boolean;
  receptionText: string;
  reception: boolean;
  receptionImages: IParticipantFile[];
  conciliation: boolean;
  conciliationText: string;
  conciliationImages: IParticipantFile[];

  active: boolean;
  updatedAt: Date;
  createdAt: Date;
}
