import * as mongoose from 'mongoose';

export interface IParticipantChoicesModel extends mongoose.Types.Subdocument {
  choice: string;
  value: number;
  backgroundColor: string;
  requireImage: boolean;
  requireComment: boolean;
  na: boolean;
  order: number;
}

const participantChoiceSchema = new mongoose.Schema({
  choice: {type: String, required: true, trim: true},
  value: {type: Number, required: true},
  backgroundColor: {type: String, default: '#ffffff'},
  requireImage: {type: Boolean, default: false},
  requireComment: {type: Boolean, default: false},
  na: {type: Boolean, default: false},
  order: {type: Number, required: true}
});

export interface IScaleModel extends mongoose.Document {
  name: string;
  minValue: number;
  maxValue: number;
  choices: mongoose.Types.Array<IParticipantChoicesModel>;
  active: boolean;
}

export const scaleSchema = new mongoose.Schema({
  name: String,
  minValue: {type: Number, required: true},
  maxValue: {type: Number, required: true},
  choices: [participantChoiceSchema],
  active: {type: Boolean, default: true}
});

export interface IParticipantAnswerModel extends mongoose.Types.Subdocument {
  question: string;
  shortName: string;

  scale: IScaleModel;
  answer: string;
  qualification: number;
  comment: string;

  risk: string;
  observe: string;

  weight: number;
  order: number;
}

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

export interface IParticipantSectionModel extends mongoose.Types.Subdocument {
  name: string;
  shortName: string;

  answers: mongoose.Types.Array<IParticipantAnswerModel>;

  qualification: number;
  weight: number;
  order: number;
}

const participantSectionsSchema = new mongoose.Schema({
  section_id: {type: mongoose.Schema.Types.ObjectId},
  name: {type: String, required: true, trim: true},
  shortName: {type: String, trim: true},

  answers: [participantAnswersSchema],

  qualification: {type: Number},
  weight: {type: Number, required: true},
  order: {type: Number, required: true}
});

export interface IParticipantModel extends mongoose.Document {
  name: string;
  user: string;

  description: string;

  sections: mongoose.Types.Array<IParticipantSectionModel>;

  qualification: number;
  active: boolean;
}

const participantSchema = new mongoose.Schema({
  name: {type: String, required: true, trim: true},
  form: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Form',
  },

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  vin: {type: String},

  description: {type: String, trim: true},

  sections: [participantSectionsSchema],

  qualification: {type: Number, default: 0},
  active: {type: Boolean, default: true}
}, {
  timestamps: true
});

const Participant = mongoose.model<IParticipantModel>('Participant', participantSchema);

export default Participant;
