import { ITeam } from './team.interface';


export interface IFormSettting {
  vinMinCharacters: number;
  vinMaxCharacters: number;
}

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

export interface IRequestSettting {
  denomination: boolean;
  denominationRequired: boolean;
  material: boolean;
  materialRequired: boolean;
  color: boolean;
  colorRequired: boolean;
  internalNumber: boolean;
  internalNumberRequired: boolean;
  internalNumberText: string;
}

export interface ITeamSetting {
  _id: any;
  inventory: IInventorySettting;
  request: IRequestSettting;
  form: IFormSettting;
  team: ITeam;
  updatedAt: Date;
  createdAt: Date;
}
