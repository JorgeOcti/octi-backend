import type { IForm } from '../../form/interfaces/form.interface';
import type { IFormModel } from '../../form/models/form.model';
import type { IMilestoneType } from './milestoneType.interface';
import type { IMilestoneTypeModel } from '../models/milestoneType.model';
import type { IRequestItemStatus } from '../../request/interfaces/requestItemStatus.interface';
import type { IRequestItemStatusModel } from '../../request/models/requestItemStatus.model';
import type { ITeam } from '../../app/interfaces/team.interface';
import type { ITeamModel } from '../../app/models/team.model';

export interface IMilestoneUpdateItems {
  arrivalDate: boolean;
}

export interface IMilestone {
  _id?: any;
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
  updateItems: IMilestoneUpdateItems;
}
