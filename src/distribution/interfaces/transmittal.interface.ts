import {ITeamModel} from "../../app/models/team.model";
import {ITeam} from "../../app/interfaces/team.interface";
import {IUser} from "../../app/interfaces/user.interface";
import {ITransmittalTransporter} from "./transmittalTransporter.interface";
import {IUserModel} from "../../app/models/user.model";
import {ITransmittalFile} from "./transmittalFile.interface";
import {ITransmittalItemModel} from "../models/transmittalItem.model";


export interface ITransmittal {
  name: string;
  number: number;
  team: ITeamModel | ITeam;
  items: ITransmittalItemModel[];
  files: ITransmittalFile[];
  evidenceFullLoad: ITransmittalFile[];
  transporter: ITransmittalTransporter;
  observation: string;
  status: string;
  createdBy: IUser | IUserModel;
}

