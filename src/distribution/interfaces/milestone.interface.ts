import {ITeam} from "../../app/interfaces/team.interface";
import {ITeamModel} from "../../app/models/team.model";
import {IForm} from "../../form/interfaces/form.interface";

export interface IMilestone {
  team: ITeam | ITeamModel;
  name: string;
  kind: string;
  step: string;
  order: number;
  form: IForm
}
