import * as mongoose from 'mongoose';
import {
  IParticipantAnswerModel,
  IParticipantChoicesModel,
  IParticipantSectionModel,
  IScaleParticipantModel
} from "../form/models/participant.model";

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

  scale: IScaleParticipantModel;
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
  name: string;
  user: string;

  description: string;

  sections: mongoose.Types.Array<IParticipantSectionModel>;

  qualification: number;
  active: boolean;
}
