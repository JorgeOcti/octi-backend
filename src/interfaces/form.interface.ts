import * as mongoose from 'mongoose';
import {IDamagesModel} from '../form/models/damages.model';
import {
  IFormAccesoryModel,
  IFormItemModel,
  IFormQuestionModel,
  IFormSectionModel, KindQuestionKeyboard, kindQuestionKeyboard
} from '../form/models/form.model';
import {IScaleModel} from '../form/models/scale.model';
import {ICompany} from './company.interface';
import {ITeam} from './team.interface';

export interface IFormItems {
  _id: any;
  item: string;
  amount: boolean;
  fallback: boolean;
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
  accessories: IFormAccesoryModel | IFormAccesory;
  damages: IDamagesModel;

  conciliation: boolean;

  risk: string;
  observe: string;

  weight: number;
  kind: string;
  order: number;

  optional: boolean;
  hint: string;
  keyboardType: string;
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
  team: ITeam | any;
  company: ICompany | any;
  description: string;

  shipping: boolean;
  shippingText: string;
  shippingImage: boolean;
  shippingVenue: boolean;
  shippingVenueText: string;

  reception: boolean;
  receptionText: string;
  receptionImage: boolean;
  receptionVenue: boolean;
  receptionVenueText: string;

  carrier: boolean;
  carrierText: string;

  conciliation: boolean;
  conciliationText: string;
  conciliationImage: boolean;

  sections: mongoose.Types.Array<IFormSectionModel>;
  url?: string;
  active: boolean;
}
