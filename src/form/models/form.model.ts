import * as mongoose from 'mongoose';
import {IForm, IFormQuestion, IFormSection} from "../../interfaces/form.interface";

export interface IFormQuestionModel extends IFormQuestion, mongoose.Types.Subdocument {}
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

  weight: {type: Number, required: true},
  order: {type: Number, required: true}
});

export interface IFormSectionModel extends IFormSection, mongoose.Types.Subdocument {}
const formSectionsSchema = new mongoose.Schema({
  name: {type: String, required: true, trim: true},
  shortName: {type: String, trim: true},

  questions: [formQuestionsSchema],

  weight: {type: Number, required: true},
  order: {type: Number, required: true}
});

export interface IFormModel extends IForm, mongoose.Document {}
const formSchema = new mongoose.Schema({
  name: {type: String, required: true, trim: true},
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  },
  description: {type: String, trim: true},

  sections: [formSectionsSchema],

  active: {type: Boolean, default: true}
}, {
  timestamps: true
});

// formSchema.set('toJSON', {
//   transform: (doc: any, ret: any, options: any) => {
//     ret.id = ret._id;
//     delete ret._id;
//     delete ret.__v;
//   }
// });

const Form = mongoose.model<IFormModel>('Form', formSchema);

export default Form;
