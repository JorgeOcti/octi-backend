import {ITeam} from "./team.interface";

export interface IInventorySettting {
  pending: string;
  pendingClass: string;
  pendingColor: string;
  found: string;
  foundClass: string;
  foundColor: string;
  missing: string;
  missingClass: string;
  missingColor: string;
  leftover: string;
  leftoverClass: string;
  leftoverColor: string;
  leftoverDifferentVenue: boolean;
  reported: string;
  reportedClass: string;
  reportedColor: string;
}

export interface ITeamSetting {
  _id: any;
  inventory: IInventorySettting;
  team: ITeam;
  updatedAt: Date;
  createdAt: Date;
}
