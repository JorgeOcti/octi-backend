import * as mongoose from 'mongoose';
import {ICompany} from "../../interfaces/company.interface";

export interface ICompanyModel extends ICompany, mongoose.Document {}

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: true
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const Company = mongoose.model<ICompanyModel>('Company', companySchema);

export default Company;
