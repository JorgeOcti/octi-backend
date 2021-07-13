import {ITeamModel} from "../app/models/team.model";
import {ITeam} from "./team.interface";
import {IUser} from "./user.interface";
import {ITransmittalTransporter} from "./transmittalTransporter.interface";
import {IUserModel} from "../app/models/user.model";
import {ITransmittalFile} from "./transmittalFile.interface";
import {ITransmittalItemModel} from "../distribution/models/transmittalItem.model";


export interface ITransmittal {
  name: string;
  number: number;
  team: ITeamModel | ITeam;
  items: ITransmittalItemModel[];
  files: ITransmittalFile[];
  transporter: ITransmittalTransporter;
  createdBy: IUser | IUserModel;
}

