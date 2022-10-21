import * as mongoose from 'mongoose';
import { PaginateModel } from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate-v2';
import {
  IParticipant,
  IParticipantAccesory,
  IParticipantAnswer,
  IParticipantChoices, IParticipantDeliveryInfo,
  IParticipantItems,
  IParticipantScale,
  IParticipantSection
} from '../interfaces/participant.interface';
import { KindForm, kindForm, KindQuestion, kindQuestion } from './form.model';
import { choiceBackgroundColors } from './scale.model';

export interface IParticipantChoicesModel extends IParticipantChoices, mongoose.Types.Subdocument {
}

const participantChoiceSchema = new mongoose.Schema({
  choice: {
    type: String,
    required: true,
    trim: true
  },
  value: {
    type: Number,
    required: true
  },
  backgroundColor: {
    type: String,
    enum: choiceBackgroundColors,
    default: 'blue'
  },
  requireImage: {
    type: Boolean,
    default: false
  },
  requireComment: {
    type: Boolean,
    default: false
  },
  requireAccesories: {
    type: Boolean,
    default: false
  },
  requireConciliation: {
    type: Boolean,
    default: false
  },
  na: {
    type: Boolean,
    default: false
  },
  order: {
    type: Number,
    required: true
  },
  optional: {
    type: Boolean,
    default: true
  },
  hint: {
    type: String,
    trim: true
  }
});

export interface IScaleParticipantModel extends IParticipantScale, mongoose.Document {
}

export const scaleSchema = new mongoose.Schema({
  name: String,
  minValue: {
    type: Number,
    required: true
  },
  maxValue: {
    type: Number,
    required: true
  },
  choices: [participantChoiceSchema],
  active: {
    type: Boolean,
    default: true
  }
});

export interface IParticipantItemModel extends IParticipantItems, mongoose.Types.Subdocument {
}

const itemSchema = new mongoose.Schema({
  item: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Boolean,
    default: false
  }
});

const accesorySchema = new mongoose.Schema({
  item: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    default: 1
  }
}, {
  _id: false
});

export interface IParticipantAccesoryModel extends IParticipantAccesory, mongoose.Types.Subdocument {
}

const accessorySchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    trim: true
  },

  items: [{ type: itemSchema }]
});

const positionSchema = new mongoose.Schema({
  name: {
    type: String
  }
});
const kindSchema = new mongoose.Schema({
  name: {
    type: String
  }
});
const partSchema = new mongoose.Schema({
  name: {
    type: String
  }
});
const damagesSchema = new mongoose.Schema({
  name: {
    type: String
  },
  positions: [positionSchema],
  kinds: [kindSchema],
  parts: [partSchema]
});

const damagesSelectedSchema = new mongoose.Schema({
  position: {
    type: mongoose.Schema.Types.ObjectId
  },
  kind: {
    type: mongoose.Schema.Types.ObjectId
  },
  part: {
    type: mongoose.Schema.Types.ObjectId
  },
  severity: {
    type: String,
    required: false
  },
  images: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParticipantFile'
  }]
});

export interface IParticipantAnswerModel extends IParticipantAnswer, mongoose.Types.Subdocument {
}

const participantAnswersSchema = new mongoose.Schema({
  question: { type: String, required: true, trim: true },
  // field to update another model
  kindUpdate: { type: String },
  shortName: { type: String, trim: true },

  scale: scaleSchema,

  damages: damagesSchema,
  damagesSelected: [damagesSelectedSchema],

  accessories: {
    type: accessorySchema,
    default: null
  },
  accesoriesSelected: [mongoose.Schema.Types.ObjectId],
  accesoriesAnswered: [{
    type: accesorySchema
  }],
  conciliation: {
    type: Boolean,
    default: false
  },
  risk: {
    type: String,
    trim: true
  },
  observe: {
    type: String,
    trim: true
  },
  answer: {
    type: mongoose.Schema.Types.ObjectId
  },
  images: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParticipantFile'
  }],
  comment: {
    type: String
  },
  na: {
    type: Boolean,
    default: false
  },
  qualification: {
    type: Number
  },
  weight: {
    type: Number,
    required: true
  },
  kind: {
    type: String,
    enum: kindQuestion,
    default: KindQuestion.scale
  },
  order: {
    type: Number,
    required: true
  },
  optional: {
    type: Boolean,
    default: false
  },

  hint: {
    type: String,
    trim: true
  },

  minValue: Number,
  maxValue: Number,
  colors: [String],
  score: Number,

  requireSeverity: {
    type: Boolean,
    default: false
  }

});

export interface IParticipantSectionModel extends IParticipantSection, mongoose.Types.Subdocument {
}

const participantSectionsSchema = new mongoose.Schema({
  section_id: {
    type: mongoose.Schema.Types.ObjectId
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  shortName: {
    type: String,
    trim: true
  },

  answers: [participantAnswersSchema],

  qualification: {
    type: Number
  },
  weight: {
    type: Number,
    required: true
  },
  order: {
    type: Number,
    required: true
  }
});

export interface IParticipantDeliveryInfoModel extends IParticipantDeliveryInfo, mongoose.Types.Subdocument {
}

const participantDeliveryInfoSchema = new mongoose.Schema({
  name: {
    type: String
  },
  rut: {
    type: String
  },
  email: {
    type: String
  },
  order: {
    type: String
  },
  signature: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParticipantFile'
  }],
  identifyCard: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParticipantFile'
  }]
});

export interface IParticipantModel extends IParticipant, mongoose.Document {
}

const participantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  number: {
    type: Number
  },
  form: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Form',
    index: true
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
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

  car: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Car',
    index: true
  },

  venue: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Venue'
  },

  description: {
    type: String,
    trim: true
  },
  sections: [participantSectionsSchema],

  hasDamages: {
    type: Boolean,
    default: false
  },

  qualification: {
    type: Number,
    default: 0
  },

  shipping: {
    type: Boolean,
    default: false
  },
  shippingText: {
    type: String,
    default: ''
  },
  shippingImages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParticipantFile'
  }],
  shippingConfirmation: {
    type: Boolean
  },
  shippingVenue: {
    type: Boolean
  },
  shippingVenueText: {
    type: String
  },
  sendTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Venue'
  },

  reception: {
    type: Boolean,
    default: false
  },
  receptionText: {
    type: String,
    default: ''
  },
  receptionImages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParticipantFile'
  }],
  receptionConfirmation: {
    type: Boolean
  },
  receptionVenue: {
    type: Boolean
  },
  receptionVenueText: {
    type: String
  },
  receiveFrom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Venue'
  },

  kind: {
    type: String,
    enum: kindForm,
    default: KindForm.control
  },

  carrier: {
    type: Boolean,
    default: false
  },
  carrierText: {
    type: String,
    default: false
  },
  carrierBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Carrier'
  },

  conciliation: {
    type: Boolean,
    default: false
  },
  conciliationText: {
    type: String,
    default: ''
  },
  conciliationImages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParticipantFile'
  }],

  transmittalItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TransmittalItem'
  },
  transmittal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transmittal'
  },

  milestone: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Milestone'
  },

  deliveryToCustomer: {
    type: Boolean,
    default: false
  },
  deliveryInfo: {
    type: participantDeliveryInfoSchema,
    default: {}
  },

  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

participantSchema.set<any>('redisCache', process.env.ENV === 'production');
participantSchema.set<any>('expires', 10);

participantSchema.index({ team: 1, deliveryToCustomer: 1, _id: -1, form: 1, venue: 1, kind: 1, createdAt: 1, car: 1 });
participantSchema.index({ team: 1, createdAt: -1, form: 1 });
participantSchema.index({ createdAt: -1 });
participantSchema.index({ createdAt: 1 });
participantSchema.index({ 'answer._id': 1, 'section._id': 1, form: 1 });
participantSchema.index({ team: 1, createdAt: 1 });
participantSchema.index({ team: 1, form: 1 });
participantSchema.index({ team: 1, form: 1, venue: 1 });
participantSchema.index({ team: 1, form: 1, createdAt: 1 });
participantSchema.index({ venue: 1 });
participantSchema.index({ company: 1 });
participantSchema.index({ user: 1 });
participantSchema.index({ car: 1 });
participantSchema.index({ shipping: 1 });
participantSchema.index({ company: 1 });
participantSchema.index({ team: 1 });
participantSchema.index({ sendTo: 1 });
participantSchema.index({ receiveFrom: 1 });
participantSchema.index({ deliveryToCustomer: 1 });
participantSchema.index({ team: 1, venue: 1, createdAt: 1 });
participantSchema.index({ team: 1, destination: 1 });
participantSchema.index({
  team: 1,
  deliveryToCustomer: 1,
  createdAt: 1
});
participantSchema.index({
  car: 1,
  team: 1,
  form: 1,
  venue: 1,
  deliveryToCustomer: 1,
  kind: 1
});
participantSchema.index({
  car: 1,
  team: 1,
  venue: 1,
  form: 1,
  'deliveryInfo.name': 1,
  'deliveryInfo.rut': 1,
  'deliveryInfo.email': 1,
  'deliveryInfo.order': 1,
  deliveryToCustomer: 1,
  kind: 1
});
participantSchema.index({
  car: 1,
  team: 1,
  venue: 1,
  form: 1,
  'deliveryInfo.name': 1,
  'deliveryInfo.rut': 1,
  'deliveryInfo.email': 1,
  'deliveryInfo.order': 1,
  deliveryToCustomer: 1,
  kind: 1,
  createdAt: 1
});

participantSchema.index({ transmittal: 1 });
participantSchema.index({ survey: 1, completed: 1 });
participantSchema.index({ form: 1, user: 1 });
participantSchema.index({ company: 1, venue: 1, createdAt: 1 });
participantSchema.index({ _id: 1, company: 1, venue: 1, createdAt: 1 });


participantSchema.plugin(mongoosePaginate);

export type ParticipantSchema =
  mongoose.Model<IParticipantModel>
  & PaginateModel<IParticipantModel>;

const Participant = mongoose.model<IParticipantModel, ParticipantSchema>('Participant', participantSchema);

export default Participant;
