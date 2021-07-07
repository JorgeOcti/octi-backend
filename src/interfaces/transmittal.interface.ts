import {ITeamModel} from "../app/models/team.model";
import {ITeam} from "./team.interface";
import {IUser} from "./user.interface";
import {ITransmittalTransporter} from "./transmittalTransporter.interface";
import {ITransmittalItem} from "./transmittalItem.interface";
import {IUserModel} from "../app/models/user.model";
import {ITransmittalFile} from "./transmittalFile.interface";


export interface ITransmittal {
  name: string;
  number: number;
  team: ITeamModel | ITeam;
  items: ITransmittalItem[];
  files: ITransmittalFile[];
  transporter: ITransmittalTransporter;
  createdBy: IUser | IUserModel;
}

