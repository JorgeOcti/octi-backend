import { ITeam } from './team.interface';


export interface IFormSettting {
  vinMinCharacters: number;
  vinMaxCharacters: number;
}

export interface IInventorySettting {
  report: IReportSetting;
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

export interface IHelpPhonesSettingSchema {
  transmittal: string;
}

export interface IChecklistSetting {
  report: IReportSetting;
}

export interface IUnitVocabReference {
  singular: string;
  plurals: string;
}

export interface IVocabularySettings {
  primary: string;
  secondary: string;
  unitReference: IUnitVocabReference
}

export interface IReportSetting {
  atLeastOne: boolean;
  vinRequired: boolean;
  plateRequired: boolean;
}

export interface ITeamSetting {
  _id: any;
  inventory: IInventorySettting;
  request: IRequestSettting;
  form: IFormSettting;
  helpPhones: IHelpPhonesSettingSchema
  team: ITeam;
  updatedAt: Date;
  createdAt: Date;
}
