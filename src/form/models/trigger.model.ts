import * as mongoose from 'mongoose';
import {PaginateModel} from "mongoose";
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
  fullname: mongoose.Schema.Types.ObjectId,
  email: mongoose.Schema.Types.ObjectId,
  signature: mongoose.Schema.Types.ObjectId,
  subject: {
    type: String,
    required: false
  },
  filename: {
    type: String,
    required: false
  },
  template: {
    type: String,
    required: false
  },
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

  config: triggerConfigSchema
});

export type FormTriggerSchema = mongoose.Model<IFormTriggerModel>;
