import {ITeam} from "../../app/interfaces/team.interface";
import {ITeamModel} from "../../app/models/team.model";
import {IForm} from "../../form/interfaces/form.interface";
import { IRequestItemStatus } from '../../request/interfaces/requestItemStatus.interface';
import { IRequestItemStatusModel } from '../../request/models/requestItemStatus.model';
import { IFormModel } from "../../form/models/form.model";

export interface IMilestone {
  _id: any;
  team: ITeam | ITeamModel;
  name: string;
  kind: string;
  step: string;
  order: number;
  requestItemStatus: IRequestItemStatus | IRequestItemStatusModel;
  form: IForm | IFormModel;
}
