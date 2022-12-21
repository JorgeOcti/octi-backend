import { IMilestoneType } from './milestoneType.interface';
import { IMilestoneTypeModel } from '../models/milestoneType.model';
import { IParticipant } from '../../form/interfaces/participant.interface';
import {ITeam} from "../../app/interfaces/team.interface";
import {ITeamModel} from "../../app/models/team.model";
import {ITransmittalFile} from "./transmittalFile.interface";
import {ITransmittalItemModel} from "../models/transmittalItem.model";
import {ITransmittalTransporter} from "./transmittalTransporter.interface";
import {IUser} from "../../app/interfaces/user.interface";
import {IUserModel} from "../../app/models/user.model";

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

