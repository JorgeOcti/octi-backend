import * as mongoose from 'mongoose';
import {IScaleModel} from './scale.model';

export interface IFormQuestionModel extends mongoose.Types.Subdocument {
  question: string;
  shortName: string;

  scale: IScaleModel;

  risk: string;
  observe: string;

  weight: number;
  order: number;
}

const formQuestionsSchema = new mongoose.Schema({
  question: String,
  shortName: String,

  scale: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Scale'
  },

  risk: String,
  observe: String,

  weight: Number,
  order: Number
});

export interface IFormSectionModel extends mongoose.Types.Subdocument {
  name: string;
  shortName: string;

  questions: mongoose.Types.Array<IFormQuestionModel>;

  weight: number;
  order: number;
}

const formSectionsSchema = new mongoose.Schema({
  name: String,
  shortName: String,

  questions: [formQuestionsSchema],

  weight: Number,
  order: Number
});

export interface IFormModel extends mongoose.Document {
  name: string;
  description: string;

  sections: mongoose.Types.Array<IFormSectionModel>;

  active: boolean;
}

const formSchema = new mongoose.Schema({
  name: String,
  description: String,

  sections: [formSectionsSchema],

  active: Boolean
}, {
  timestamps: true
});

const Form = mongoose.model<IFormModel>('Form', formSchema);

export default Form;
