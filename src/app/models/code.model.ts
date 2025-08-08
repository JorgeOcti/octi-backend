import * as mongoose from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate-v2';


import { PaginateModel } from 'mongoose';
import type { ICode } from '../interfaces/code.interface';

export interface ICodeModel extends ICode, mongoose.Document<any> { }
const codeSchema = new mongoose.Schema({
  code: {
    type: String,
    trim: true,
    required: true
  },
  correlative: {
    type: String, 
    unique: true,
    required: true
  },
  description: {
    type: String,
  },
  internalCode: {
    type: String,
  },
  type: {
    type:String,
    required: false
  },
  fileCode: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CodeFile',
        required: false
      }
  ],
  fileUnit: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CodeFile',
      required: false
    }
  ]
}, {
  timestamps: true
});

codeSchema.plugin(mongoosePaginate);

export type CodeSchema = mongoose.Model<ICodeModel> & PaginateModel<ICodeModel> & {};

const Code = mongoose.model<ICodeModel, CodeSchema>('Code', codeSchema);
export default Code;
