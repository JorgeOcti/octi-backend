import {IIFile} from '../../interfaces/file.interface';
import {IMilestone} from "./milestone.interface";
import {IMilestoneModel} from "../models/milestone.model";
import {ITeam} from "../../app/interfaces/team.interface";
import {ITeamModel} from "../../app/models/team.model";
import {ITransmittal} from "./transmittal.interface";
import {ITransmittalModel} from "../models/transmittal.model";
import {IUser} from "../../app/interfaces/user.interface";
import {IUserModel} from "../../app/models/user.model";

export interface ITransmittalFile {
  _id?: any;
  transmittal: ITransmittal | ITransmittalModel;
  user: IUser | IUserModel;
  team: ITeam | ITeamModel;
  file: IIFile;
  thumbnail: IIFile;
  milestone?: IMilestone | IMilestoneModel
  createdAt?: Date;
}
