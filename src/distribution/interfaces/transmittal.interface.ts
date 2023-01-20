import type { ITeam } from "../../app/interfaces/team.interface";
import type { IUser } from "../../app/interfaces/user.interface";
import type { ITeamModel } from "../../app/models/team.model";
import type { IUserModel } from "../../app/schemas/user.schema";
import type { IParticipant } from '../../form/interfaces/participant.interface';
import type { IMilestoneTypeModel } from '../models/milestoneType.model';
import type { ITransmittalItemModel } from "../models/transmittalItem.model";
import type { IMilestoneType } from './milestoneType.interface';
import type { ITransmittalFile } from "./transmittalFile.interface";
import type { ITransmittalTransporter } from "./transmittalTransporter.interface";

export interface ITransmittal {
  _id?: any,
  name: string;
  number: number;
  team: ITeamModel | ITeam;
  type: IMilestoneType | IMilestoneTypeModel;
  items: ITransmittalItemModel[];
  files: ITransmittalFile[];
  evidenceFullLoad: ITransmittalFile[];
  transporter: ITransmittalTransporter;
  observation: string;
  revision: IParticipant;
  status: string;
  createdBy: IUser | IUserModel;
  passBorder: boolean;
}

