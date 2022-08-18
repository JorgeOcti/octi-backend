import {ITeamModel} from "../../app/models/team.model";
import {ITeam} from "../../app/interfaces/team.interface";
import {IUser} from "../../app/interfaces/user.interface";
import {ITransmittalTransporter} from "./transmittalTransporter.interface";
import {IUserModel} from "../../app/models/user.model";
import {ITransmittalFile} from "./transmittalFile.interface";
import {ITransmittalItemModel} from "../models/transmittalItem.model";
import { IParticipant } from '../../form/interfaces/participant.interface';
import { IMilestoneType } from './milestoneType.interface';
import { IMilestoneTypeModel } from '../models/milestoneType.model';


export interface ITransmittal {
  _id: any,
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

