import * as mongoose from 'mongoose';
import {
  IParticipantAccesoryModel,
  IParticipantAnswerModel,
  IParticipantChoicesModel, IParticipantItemModel,
  IParticipantSectionModel, IScaleParticipantModel,
} from "../form/models/participant.model";
import {IUserModel} from "../app/models/user.model";
import {IFormModel} from "../form/models/form.model";
import {ICompanyModel} from "../app/models/company.model";
import {ICarModel} from "../app/models/car.model";
import {IParticipantFile} from "./participantFile.interface";

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
  items: IParticipantItemModel[]
}

export interface IParticipantAnswer {
  question: string;
  shortName: string;

  scale: IScaleParticipantModel;

  accessories: IParticipantAccesoryModel;
  accesoriesSelected: any[];
  conciliation: boolean;

  answer: string;
  images: IParticipantFile[],
  qualification: number;
  comment: string;

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
  company: ICompanyModel;

  user: IUserModel;
  car: ICarModel;

  description: string;

  sections: mongoose.Types.Array<IParticipantSectionModel>;

  qualification: number;
  active: boolean;
  updatedAt: Date;
  createdAt: Date;
}
