import {ITeam} from "../../app/interfaces/team.interface";
import {ITeamModel} from "../../app/models/team.model";
import {IForm} from "../../form/interfaces/form.interface";
import { IRequestItemStatus } from '../../request/interfaces/requestItemStatus.interface';
import { IRequestItemStatusModel } from '../../request/models/requestItemStatus.model';

export interface IMilestone {
  team: ITeam | ITeamModel;
  name: string;
  kind: string;
  step: string;
  order: number;
  requestItemStatus: IRequestItemStatus | IRequestItemStatusModel;
  form: IForm
}
