import * as mongoose from 'mongoose';
import {
  IChoicesModel
} from '../models/scale.model';
import {ICompany} from '../../app/interfaces/company.interface';
import {ITeam} from '../../app/interfaces/team.interface';

export interface IChoices {
  choice: string;
  value: number;
  backgroundColor: string;
  requireImage: boolean;
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
