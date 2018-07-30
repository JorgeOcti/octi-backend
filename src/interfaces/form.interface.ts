import * as mongoose from 'mongoose';
import {
  IFormAccesoryModel,
  IFormItemModel,
  IFormQuestionModel,
  IFormSectionModel
} from '../form/models/form.model';
import {
  IScaleModel
} from '../form/models/scale.model';
import {ICompany} from './company.interface';

export interface IFormItems {
  _id: any;
  item: string;
}

export interface IFormAccesory {
  _id: any;
  question: string;
  items: IFormItemModel[];
}

export interface IFormQuestion {
  _id: any;
  question: string;
  shortName: string;

  scale: IScaleModel;
  accessories: IFormAccesoryModel;

  conciliation: boolean;

  risk: string;
  observe: string;

  weight: number;
  order: number;
}

export interface IFormSection {
  _id: any;
  name: string;
  shortName: string;

  questions: mongoose.Types.Array<IFormQuestionModel>;

  weight: number;
  order: number;
}

export interface IForm {
  _id: any;
  name: string;
  company: ICompany | any;
  description: string;

  sections: mongoose.Types.Array<IFormSectionModel>;
  url?: string;
  active: boolean;
}
