import * as mongoose from 'mongoose';
import {IForm, IFormAccesory, IFormItems, IFormQuestion, IFormSection} from "../../interfaces/form.interface";


export interface IFormItemModel extends IFormItems, mongoose.Types.Subdocument {}
const itemSchema = new mongoose.Schema({
  item: {type: String, required: true, trim: true},
});

export interface IFormAccesoryModel extends IFormAccesory, mongoose.Types.Subdocument {}
const accessorySchema = new mongoose.Schema({
  question: {type: String, required: true, trim: true},

  items: [itemSchema]
});

export interface IFormQuestionModel extends IFormQuestion, mongoose.Types.Subdocument {}
const formQuestionsSchema = new mongoose.Schema({
  question: {type: String, required: true, trim: true},
  shortName: {type: String, trim: true},

  scale: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Scale',
    required: true
  },

  accessories: {
    type: accessorySchema,
    default: null
  },

  conciliation: {type: Boolean, default: false},

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
  name: {
    type: String,
    required: true,
    trim: true
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  description: {
    type: String,
    trim: true
  },

  sections: [formSectionsSchema],

  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

formSchema.virtual('participants', {
  ref: 'Participant', // The model to use
  localField: '_id', // Find field in this model
  foreignField: 'form', // is equal to field in another model
  justOne: false
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
