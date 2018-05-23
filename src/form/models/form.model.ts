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
  question: {type: String, required: true, trim: true},
  shortName: {type: String, trim: true},

  scale: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Scale',
    required: true
  },

  risk: {type: String, trim: true},
  observe: {type: String, trim: true},

  weight: { type: Number, required: true },
  order: { type: Number, required: true }
});

export interface IFormSectionModel extends mongoose.Types.Subdocument {
  name: string;
  shortName: string;

  questions: mongoose.Types.Array<IFormQuestionModel>;

  weight: number;
  order: number;
}

const formSectionsSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true},
  shortName: {type: String, trim: true},

  questions: [formQuestionsSchema],

  weight: { type: Number, required: true },
  order: { type: Number, required: true }
});

export interface IFormModel extends mongoose.Document {
  name: string;
  description: string;

  sections: mongoose.Types.Array<IFormSectionModel>;
  url?: string;
  active: boolean;
}

const formSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true},
  description: {type: String, trim: true},

  sections: [formSectionsSchema],

  active: { type: Boolean, default: true }
}, {
  timestamps: true
});

const Form = mongoose.model<IFormModel>('Form', formSchema);

export default Form;
