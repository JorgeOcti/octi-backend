import * as mongoose from 'mongoose';
import { PaginateModel } from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate-v2';
import type { IReason } from '../interfaces/reason.interface';

export interface IReasonModel extends IReason, mongoose.Document<any> { }

const fileSchema = new mongoose.Schema({
  active: {
    type: Boolean
  },
  required: {
    type: Boolean
  }
});

export enum ChoicesTypeQuestion {
  text = 'text',
  number = 'number',
  paymentMethod = 'paymentMethod'
}

export const choicesTypeQuestuion = [
  ChoicesTypeQuestion.text,
  ChoicesTypeQuestion.number,
  ChoicesTypeQuestion.paymentMethod
];

const questionSchema = new mongoose.Schema({
  name: {
    type: String
  },
  type: {
    type: String,
    enum: choicesTypeQuestuion,
    default: ChoicesTypeQuestion.text
  },
  required: {
    type: Boolean,
    default: false
  }
});

const reasonSchema = new mongoose.Schema({
  name: {
    type: String
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  file: {
    type: fileSchema,
    default: {
      active: false,
      required: false
    }
  },
  questions: {
    type: [questionSchema],
    default: []
  }
});

reasonSchema.set<any>('redisCache', process.env.ENV === 'production');
reasonSchema.set<any>('expires', 30);

reasonSchema.plugin(mongoosePaginate);

export type ReasonSchema = mongoose.Model<IReasonModel> & PaginateModel<IReasonModel>;

const Reason = mongoose.model<IReasonModel, ReasonSchema>('Reason', reasonSchema);

export default Reason;

