import * as mongoose from 'mongoose';
import {
  IChoicesModel
} from '../form/models/scale.model';

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
  minValue: number;
  maxValue: number;
  choices: mongoose.Types.Array<IChoicesModel>;
  active: boolean;
}
