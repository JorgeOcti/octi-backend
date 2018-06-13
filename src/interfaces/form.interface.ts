import * as mongoose from 'mongoose';
import {
  IScaleModel
} from "../form/models/scale.model";
import {ICompany} from "./company.interface";

export interface IFormQuestion {
  _id: any;
  question: string;
  shortName: string;

  scale: IScaleModel;

  risk: string;
  observe: string;

  weight: number;
  order: number;
}

export interface IFormSection {
  _id: any;
  name: string;
  shortName: string;

  questions: mongoose.Types.Array<IFormQuestion>;

  weight: number;
  order: number;
}

export interface IForm {
  _id: any;
  name: string;
  company: ICompany | any;
  description: string;

  sections: mongoose.Types.Array<IFormSection>;
  url?: string;
  active: boolean;
}
