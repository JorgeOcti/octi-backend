import * as mongoose from 'mongoose';
import {IBranchOffice} from "../../interfaces/branshOffice.interface";

export interface IBranchOfficeModel extends IBranchOffice, mongoose.Document {}

const branshOfficeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    index: true
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const BranshOffice = mongoose.model<IBranchOfficeModel>('BranshOffice', branshOfficeSchema);

export default BranshOffice;
