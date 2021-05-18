import * as mongoose from 'mongoose';
import {IFormTrigger, ITriggerConfig} from "../../interfaces/form.interface";

export enum KindTrigger {
  file = 'file',
  email = 'email',
}

export const kindTrigger = [
  KindTrigger.file,
  KindTrigger.email,
];

export interface ITriggerConfigModel extends ITriggerConfig, mongoose.Types.Subdocument {}
export const triggerConfigSchema = new mongoose.Schema({
  fullname: [mongoose.Schema.Types.Mixed],
  email: [mongoose.Schema.Types.Mixed],
  signature: mongoose.Schema.Types.ObjectId,
  subject: String,
  filename:String,
  template:String
});


export interface IFormTriggerModel extends IFormTrigger, mongoose.Types.Subdocument {}
export const formTriggerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },

  kind: {
    type: String,
    enum: kindTrigger,
  },

  enabled: {
    type: Boolean,
    default: true
  },

  config: triggerConfigSchema
});

export type FormTriggerSchema = mongoose.Model<IFormTriggerModel>;
