import * as mongoose from 'mongoose';
import type { ICompany } from '../../app/interfaces/company.interface';
import type { ITeam } from '../../app/interfaces/team.interface';
import type { IRequestItemStatus } from '../../request/interfaces/requestItemStatus.interface';
import type { IRequestItemStatusModel } from '../../request/models/requestItemStatus.model';
import type { IDamagesModel } from '../models/damages.model';
import type { IFormAccesoryModel, IFormItemModel, IFormQuestionModel, IFormSectionModel } from '../models/form.model';
import type { IScaleModel } from '../models/scale.model';
import type { IFormTriggerModel } from "../models/trigger.model";
import {IQuestionTriggerModel} from "../models/questionTrigger.model";
import { IMatrix, webQuestion } from './participant.interface';

export interface IFormItems {
  _id?: any;
  item: string;
  amount: boolean;
  fallback: boolean;
}

export interface IFormAccesory {
  _id?: any;
  question: string;
  multi: boolean;
  items: IFormItemModel[];
}

export interface IFormQuestion {
  _id?: any;
  question: string;
  kindUpdate: string;
  shortName: string;

  scale: IScaleModel;
  accessories: IFormAccesoryModel | IFormAccesory;
  damages: IDamagesModel;
  matrix: IMatrix;

  conciliation: boolean;

  risk: string;
  observe: string;

  weight: number;
  kind: string;
  order: number;

  optional: boolean;
  hint: string;
  keyboardType: string;
  imageType: string;

  minValue: number;
  maxValue: number;
  colors: string[];

  requireSeverity: boolean;
  requirePicture: boolean;

  triggers: mongoose.Types.Array<IQuestionTriggerModel>;

}

export interface IFormSection {
  _id?: any;
  name: string;
  shortName: string;

  questions: mongoose.Types.Array<IFormQuestionModel>;

  weight: number;
  order: number;
}

export interface ITriggerConfig {
  fullname: any;
  email: any;
  subject: string;

  responsible: boolean;

  signature: any;
  filename: string;

  template: string;

  integrationType: string;
  header: string;
  url: string;
  method: string;
  body: string;

  requestItemStatus: IRequestItemStatus | IRequestItemStatusModel;

  questionName?: string;
  prompt?: string;
}

export interface IFormTrigger {
  _id?: any;
  name: string;
  description: string;
  enabled: boolean;
  kind: string;
  config: ITriggerConfig | any;
}

export interface IForm {
  _id?: any;
  name: string;
  team: ITeam | any;
  company: ICompany | any;
  description: string;

  kind: string;

  action: string;

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
  triggers: mongoose.Types.Array<IFormTriggerModel>;

  autosave: boolean;
  template: string;

  webQuestion?: webQuestion;

  url?: string;
  deliveryToCustomer: boolean;
  active: boolean;
}
