import * as mongoose from 'mongoose';
import {
  IChoicesModel
} from '../form/models/scale.model';
import {ICompany} from './company.interface';
import {ITeam} from './team.interface';

export interface IChoices {
  choice: string;
  value: number;
  backgroundColor: string;
  requireImage: boolean;
  requireVenue: boolean;
  requireComment: boolean;
  requireAccesories: boolean;
  na: boolean;
  order: number;
}

export interface IScale {
  name: string;
  company: ICompany;
  team: ITeam;
  minValue: number;
  maxValue: number;
  choices: mongoose.Types.Array<IChoicesModel>;
  active: boolean;
}
