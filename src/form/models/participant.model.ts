import * as mongoose from 'mongoose';
import {IParticipant, IParticipantAnswer, IParticipantChoices, IParticipantScale, IParticipantSection} from "../../interfaces/participant.interface";

export interface IParticipantChoicesModel extends IParticipantChoices, mongoose.Types.Subdocument {}
const participantChoiceSchema = new mongoose.Schema({
  choice: {type: String, required: true, trim: true},
  value: {type: Number, required: true},
  backgroundColor: {type: String, default: '#ffffff'},
  requireImage: {type: Boolean, default: false},
  requireComment: {type: Boolean, default: false},
  na: {type: Boolean, default: false},
  order: {type: Number, required: true}
});

export interface IScaleParticipantModel extends IParticipantScale, mongoose.Document {}
export const scaleSchema = new mongoose.Schema({
  name: String,
  minValue: {type: Number, required: true},
  maxValue: {type: Number, required: true},
  choices: [participantChoiceSchema],
  active: {type: Boolean, default: true}
});

export interface IParticipantAnswerModel extends IParticipantAnswer, mongoose.Types.Subdocument {}
const participantAnswersSchema = new mongoose.Schema({
  question: {type: String, required: true, trim: true},
  shortName: {type: String, trim: true},

  scale: scaleSchema,

  risk: {type: String, trim: true},
  observe: {type: String, trim: true},

  answer: {type: mongoose.Schema.Types.ObjectId},
  comment: {type: String},
  qualification: {type: Number},

  weight: {type: Number, required: true},
  order: {type: Number, required: true}
});

export interface IParticipantSectionModel extends IParticipantSection, mongoose.Types.Subdocument {}
const participantSectionsSchema = new mongoose.Schema({
  section_id: {type: mongoose.Schema.Types.ObjectId},
  name: {type: String, required: true, trim: true},
  shortName: {type: String, trim: true},

  answers: [participantAnswersSchema],

  qualification: {type: Number},
  weight: {type: Number, required: true},
  order: {type: Number, required: true}
});

export interface IParticipantModel extends IParticipant, mongoose.Document {}
const participantSchema = new mongoose.Schema({
  name: {type: String, required: true, trim: true},
  form: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Form',
    index: true
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  vin: {
    type: String,
    trim: true
  },

  description: {type: String, trim: true},

  sections: [participantSectionsSchema],

  qualification: {type: Number, default: 0},
  active: {type: Boolean, default: true}
}, {
  timestamps: true
});

participantSchema.index({ form: 1, user: 1 });

const Participant = mongoose.model<IParticipantModel>('Participant', participantSchema);

export default Participant;
