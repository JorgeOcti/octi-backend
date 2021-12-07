import {ITeam} from "../../app/interfaces/team.interface";
import {ITeamModel} from "../../app/models/team.model";
import {IForm} from "../../form/interfaces/form.interface";
import { IRequestItemStatus } from '../../request/interfaces/requestItemStatus.interface';
import { IRequestItemStatusModel } from '../../request/models/requestItemStatus.model';
import { IFormModel } from "../../form/models/form.model";
import { IMilestoneType } from './milestoneType.interface';
import { IMilestoneTypeModel } from '../models/milestoneType.model';

export interface IMilestone {
  _id: any;
  team: ITeam | ITeamModel;
  type: IMilestoneType | IMilestoneTypeModel;
  name: string;
  description?: string;
  hint?: string;
  kind: string;
  step: string;
  order: number;
  requestItemStatus: IRequestItemStatus | IRequestItemStatusModel;
  form: IForm | IFormModel;
}
