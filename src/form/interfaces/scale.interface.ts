import * as mongoose from 'mongoose';
import type { ICompany } from '../../app/interfaces/company.interface';
import type { ITeam } from '../../app/interfaces/team.interface';
import type {
  IChoicesModel
} from '../models/scale.model';

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
