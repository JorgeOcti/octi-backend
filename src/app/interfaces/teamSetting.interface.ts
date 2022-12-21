import { ITeam } from './team.interface';

export interface IFormSettting {
  report: IReportSetting;
  vinMinCharacters: number;
  vinMaxCharacters: number;
}

export interface IInventorySetting {
  report: IReportSetting | null;
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

export interface IRequestSetting {
  brand: boolean;
  brandReadOnly: boolean;
  denomination: boolean;
  denominationReadOnly: boolean;
  denominationRequired: boolean;
  material: boolean;
  materialReadOnly: boolean;
  materialRequired: boolean;
  color: boolean;
  colorReadOnly: boolean;
  colorRequired: boolean;
  entry: boolean;
  sellerText: boolean;
  reason: boolean;
  conectaID: boolean;
  ticket: boolean;
  priority: boolean;
  internalNumber: boolean;
  internalNumberRequired: boolean;
  internalNumberText: string;
  secondColorOption: boolean;
  thirdColorOption: boolean;
}

export interface IHelpPhonesSettingSchema {
  transmittal: string;
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
  primaryRequired: boolean;
  secondaryRequired: boolean;
}

export interface ITeamSetting {
  _id?: any;
  inventory: IInventorySetting;
  request: IRequestSetting;
  form: IFormSettting;
  helpPhones: IHelpPhonesSettingSchema
  team: ITeam;
  updatedAt: Date;
  createdAt: Date;
}
