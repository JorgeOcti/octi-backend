import {QuestionTriggerKind} from "./questionTrigger.types";
import {IQuestionTriggerConfig} from "../interfaces/questionTrigger.interface";
import mongoose from "mongoose";

export const kindsTrigger = [
  QuestionTriggerKind.fill,
  QuestionTriggerKind.check,
  QuestionTriggerKind.checkandfill,
];

export interface IQuestionTriggerConfigModel extends IQuestionTriggerConfig, mongoose.Types.Subdocument {}
export const questionTriggerConfigSchema = new mongoose.Schema({
  url : {
    type: String,
  },

  value: {
    type: String,
  },

  check: {
    type: String,
    optional: true
  },

  responseMapping: {
    type: mongoose.Schema.Types.Map,
  }
});

export interface IQuestionTriggerModel extends IQuestionTriggerConfigModel, mongoose.Types.Subdocument {}

export const questionTriggerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  enabled: {
    type: Boolean,
    default: true
  },
  kind: {
    type: String,
    enum: kindsTrigger
  },
  config: questionTriggerConfigSchema
});

const QuestionTrigger = mongoose.model<IQuestionTriggerModel>(
  'QuestionTrigger',
  questionTriggerSchema
);

export default QuestionTrigger;
