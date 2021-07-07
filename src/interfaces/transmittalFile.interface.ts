import {IIFile} from './file.interface';
import {ITransmittal} from "./transmittal.interface";
import {ITransmittalModel} from "../distribution/models/transmittal.model";
import {IUser} from "./user.interface";
import {IUserModel} from "../app/models/user.model";
import {ITeam} from "./team.interface";
import {ITeamModel} from "../app/models/team.model";

export interface ITransmittalFile {
  _id: any;
  transmittal: ITransmittal | ITransmittalModel;
  user: IUser | IUserModel;
  team: ITeam | ITeamModel;
  file: IIFile;
  thumbnail: IIFile;
}
