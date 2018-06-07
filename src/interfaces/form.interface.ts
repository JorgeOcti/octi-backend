import * as mongoose from 'mongoose';
import {
  IFormQuestionModel,
  IFormSectionModel
} from "../form/models/form.model";
import {
  IScaleModel
} from "../form/models/scale.model";
import {ICompany} from "./company.interface";

export interface IFormQuestion {
  question: string;
  shortName: string;

  scale: IScaleModel;

  risk: string;
  observe: string;

  weight: number;
  order: number;
}

export interface IFormSection {
  name: string;
  shortName: string;

  questions: mongoose.Types.Array<IFormQuestionModel>;

  weight: number;
  order: number;
}

export interface IForm {
  name: string;
  company: ICompany | any;
  description: string;

  sections: mongoose.Types.Array<IFormSectionModel>;
  url?: string;
  active: boolean;
}
