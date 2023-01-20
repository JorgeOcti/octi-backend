import type { ITeam } from "../../app/interfaces/team.interface";
import type { IUser } from "../../app/interfaces/user.interface";
import type { ITeamModel } from "../../app/models/team.model";
import type { IUserModel } from "../../app/schemas/user.schema";
import type { IIFile } from '../../interfaces/file.interface';
import type { IMilestoneModel } from "../models/milestone.model";
import type { ITransmittalModel } from "../models/transmittal.model";
import type { IMilestone } from "./milestone.interface";
import type { ITransmittal } from "./transmittal.interface";

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
