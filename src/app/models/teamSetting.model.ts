import * as mongoose from 'mongoose';
import {ITeamSetting} from '../interfaces/teamSetting.interface';

export interface ITeamSettingModel extends ITeamSetting, mongoose.Document {}

const inventorySettingSchema = new mongoose.Schema({
  pending: {
    type: String
  },
  pendingClass: {
    type: String
  },
  pendingColor: {
    type: String
  },
  found: {
    type: String
  },
  foundClass: {
    type: String
  },
  foundColor: {
    type: String
  },
  missing: {
    type: String
  },
  missingClass: {
    type: String
  },
  missingColor: {
    type: String
  },
  leftover: {
    type: String
  },
  leftoverClass: {
    type: String
  },
  leftoverColor: {
    type: String
  },
  leftoverDifferentVenue: {
    type: Boolean,
    default: false
  },
  reported: {
    type: String
  },
  reportedClass: {
    type: String
  },
  reportedColor: {
    type: String
  }
});

const teamSettingSchema = new mongoose.Schema({
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  inventory: inventorySettingSchema
}, {
  timestamps: true
});

const TeamSetting = mongoose.model<ITeamSettingModel>('TeamSetting', teamSettingSchema);

export default TeamSetting;
