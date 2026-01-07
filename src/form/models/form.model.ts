import * as mongoose from 'mongoose';
import { PaginateModel } from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate-v2';
import type {
  IForm,
  IFormAccesory,
  IFormItems,
  IFormQuestion,
  IFormSection
} from '../interfaces/form.interface';

import { formTriggerSchema } from './trigger.model';
import { questionTriggerSchema } from "./questionTrigger.model";

export interface IFormItemModel
  extends IFormItems,
  mongoose.Types.Subdocument { }

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

export interface IFormAccesoryModel
  extends IFormAccesory,
  mongoose.Types.Subdocument { }

const accessorySchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    trim: true
  },
  multi: Boolean,
  items: [itemSchema]
});

export enum MatrixItemType {
  text = 'text',
  photo = 'photo',
}

export const matrixItemType = [
  MatrixItemType.text,
  MatrixItemType.photo
];


export const MatrixItemSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: matrixItemType,
    default: MatrixItemType.text
  },
  value: {
    type: String,
    trim: true,
  },
  images: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParticipantFile'
  }]
})

export const MatrixSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  questions: [MatrixItemSchema],
}, {
  timestamps: false
})

export enum KindQuestion {
  scale = 'scale',
  numericScale = 'numeric-scale',
  accessory = 'accessory',
  text = 'text',
  venue = 'venue',
  damage = 'damage',
  carrier = 'carrier',
  image = 'image',
  matrix = 'matrix'
}

export const kindQuestion = [
  KindQuestion.numericScale,
  KindQuestion.scale,
  KindQuestion.text,
  KindQuestion.accessory,
  KindQuestion.damage,
  KindQuestion.venue,
  KindQuestion.carrier,
  KindQuestion.image,
  KindQuestion.matrix
];

export enum KindQuestionKeyboard {
  text = 'text',
  numeric = 'numeric',
  email = 'email'
}

export const kindQuestionKeyboard = [
  KindQuestionKeyboard.text,
  KindQuestionKeyboard.numeric,
  KindQuestionKeyboard.email
];

export enum KindActionForm {
  delivery = 'delivery',
  shipping = 'shipping',
  reception = 'reception'
}

export const kindActionForm = [
  KindActionForm.delivery,
  KindActionForm.shipping,
  KindActionForm.reception
];

export enum KindQuestionImage {
  photo = 'photo',
  signature = 'signature',
  picture = 'picture'
}

export const kindQuestionImage = [
  KindQuestionImage.photo,
  KindQuestionImage.signature,
  KindQuestionImage.picture
];

export interface IFormQuestionModel
  extends IFormQuestion,
  mongoose.Types.Subdocument { }

const formQuestionsSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    trim: true
  },
  // field to update another model
  kindUpdate: {
    type: String
  },
  shortName: {
    type: String,
    trim: true
  },
  scale: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Scale'
  },

  damages: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Damages'
  },

  accessories: {
    type: accessorySchema,
    default: null
  },

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

  keyboardType: {
    type: String,
    enum: kindQuestionKeyboard,
    default: KindQuestionKeyboard.text
  },

  imageType: {
    type: String,
    enum: kindQuestionImage,
    default: KindQuestionImage.picture
  },

  matrix: {
    type: MatrixSchema,
    default: null
  },

  minValue: Number,
  maxValue: Number,
  colors: [String],

  requireSeverity: {
    type: Boolean,
    default: false
  },
  requirePicture: {
    type: Boolean,
    default: false
  },

  triggers: [questionTriggerSchema],
});

export interface IFormSectionModel
  extends IFormSection,
  mongoose.Types.Subdocument { }

const formSectionsSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  shortName: {
    type: String,
    trim: true
  },

  questions: [formQuestionsSchema],

  weight: {
    type: Number,
    required: true
  },
  order: {
    type: Number,
    required: true
  }
});

const UnitTypeSchema = new mongoose.Schema({
  container: {
    type: Boolean,
    default: false
  },
  units: {
    type: Boolean,
    default: true
  }
}, {
  _id: false,
  timestamps: false
})

export enum KindForm {
  init = 'init',
  control = 'control',
  final = 'final',
  transmittal = 'transmittal',
  openContainer = 'openContainer',
  closeContainer = 'closeContainer',
  generalUnitType = 'unitType',
  codedUnitType = 'codedUnitType'
}

export const kindForm = [
  KindForm.init,
  KindForm.final,
  KindForm.control,
  KindForm.transmittal,
  KindForm.openContainer,
  KindForm.closeContainer,
  KindForm.generalUnitType,
  KindForm.codedUnitType
];

const webQuestionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['text', 'number', 'email', 'phone'],
    default: 'text'
  },
  answer: {
    type: String,
    default: null
  },
}, {
  _id: false
})

export interface IFormModel extends IForm, mongoose.Document { }

const formSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
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
    description: {
      type: String,
      trim: true
    },

    // if shipping form
    shipping: {
      type: Boolean,
      default: false
    },
    shippingText: {
      type: String,
      default: ''
    },

    shippingImage: {
      type: Boolean,
      default: false
    },
    // mark if require venue
    shippingVenue: {
      type: Boolean,
      default: false
    },
    // text if require venue
    shippingVenueText: {
      type: String,
      default: ''
    },

    // if reception form
    reception: {
      type: Boolean,
      default: false
    },
    receptionText: {
      type: String,
      default: ''
    },
    receptionImage: {
      type: Boolean,
      default: false
    },
    // mark if require venue
    receptionVenue: {
      type: Boolean,
      default: false
    },
    // text if require venue
    receptionVenueText: {
      type: String,
      default: ''
    },

    // if require select carrier
    carrier: {
      type: Boolean,
      default: false
    },
    carrierText: {
      type: String,
      default: ''
    },

    conciliation: {
      type: Boolean,
      default: false
    },
    conciliationText: {
      type: String,
      default: ''
    },
    conciliationImage: {
      type: Boolean,
      default: false
    },

    kind: {
      type: String,
      enum: kindForm,
      default: KindForm.control
    },

    action: {
      type: String,
      enum: kindActionForm
    },

    hidden: {
      type: Boolean,
      default: false
    },

    webQuestion: {
      type: webQuestionSchema,
      default: null
    },

    unitsToUse: {
      type: UnitTypeSchema,
      default: {
        container: false,
        units: true
      },
      template: {
        type: String,
        default: 'form/carDetail/base.pug'
      },
    },

    kind: {

    }

    sections: [formSectionsSchema],
    triggers: [formTriggerSchema],
    deliveryToCustomer: {
      type: Boolean,
      default: false
    },
    autosave: {
      type: Boolean,
      default: false
    },
    active: {
      type: Boolean,
      default: true
    }

  },
  {
    timestamps: true
  }
);

formSchema.set<any>('redisCache', process.env.ENV === 'production');
formSchema.set<any>('expires', 30);

formSchema.index({ team: 1 });
formSchema.index({ team: 1, active: 1 });
formSchema.index({ createdAt: -1 });
formSchema.index({ team: 1, status: 1, createdAt: -1 });

formSchema.plugin(mongoosePaginate);

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

export type FormSchema = mongoose.Model<IFormModel> & PaginateModel<IFormModel>;

const Form = mongoose.model<IFormModel, FormSchema>('Form', formSchema);

export default Form;
