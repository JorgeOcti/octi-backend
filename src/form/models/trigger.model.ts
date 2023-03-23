import * as mongoose from 'mongoose';
import type {
  IFormTrigger,
  ITriggerConfig
} from '../interfaces/form.interface';
import { KindTrigger } from './trigger.types';

export const kindsTrigger = [
  KindTrigger.file,
  KindTrigger.email,
  KindTrigger.request,
  KindTrigger.integration,
  KindTrigger.transmittal
];

export enum IntegrationType {
  http = 'http',
  sap = 'sap',
  conecta = 'conecta',
  integration = 'integration'
}

export const integrationTypes = [
  IntegrationType.http,
  IntegrationType.sap,
  IntegrationType.conecta
];

export interface ITriggerConfigModel
  extends ITriggerConfig,
    mongoose.Types.Subdocument {}
export const triggerConfigSchema = new mongoose.Schema({
  fullname: {
    type: mongoose.Schema.Types.Mixed
  },
  email: {
    type: mongoose.Schema.Types.Mixed
  },
  signature: {
    type: mongoose.Schema.Types.ObjectId
  },
  subject: {
    type: String
  },
  responsible: {
    type: Boolean,
    default: false
  },
  filename: {
    type: String
  },
  template: {
    type: String
  },

  integrationType: {
    type: String,
    enum: integrationTypes
  },
  header: {
    type: String
  },
  url: {
    type: String
  },
  method: {
    type: String
  },
  body: {
    type: String
  },

  requestItemStatus: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RequestItemStatus'
  },

  transmittalTypes: {
    type: [mongoose.Schema.Types.ObjectId]
  }
});

export interface IFormTriggerModel extends IFormTrigger, mongoose.Document {}
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
    enum: kindsTrigger
  },

  enabled: {
    type: Boolean,
    default: true
  },

  config: triggerConfigSchema
});

const FormTrigger = mongoose.model<IFormTriggerModel>(
  'FormTrigger',
  formTriggerSchema
);

export default FormTrigger;
