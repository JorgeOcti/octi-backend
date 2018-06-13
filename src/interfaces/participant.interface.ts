import * as mongoose from 'mongoose';
import {
  IParticipantAnswerModel,
  IParticipantChoicesModel,
  IParticipantSectionModel,
} from "../form/models/participant.model";
import {IUserModel} from "../app/models/user.model";
import {IFormModel} from "../form/models/form.model";
import {ICompanyModel} from "../app/models/company.model";
import {ICarModel} from "../app/models/car.model";

export interface IParticipantChoices {
  choice: string;
  value: number;
  backgroundColor: string;
  requireImage: boolean;
  requireComment: boolean;
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

export interface IParticipantAnswer {
  question: string;
  shortName: string;

  scale: IParticipantScale;
  answer: string;
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
