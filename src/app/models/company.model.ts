import * as mongoose from 'mongoose';
import {ICompany} from '../../interfaces/company.interface';

export interface ICompanyModel extends ICompany, mongoose.Document {}

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: true
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

companySchema.virtual('users', {
  ref: 'User', // The model to use
  localField: '_id', // Find field in this model
  foreignField: 'company', // is equal to field in another model
  justOne: false
});

const Company = mongoose.model<ICompanyModel>('Company', companySchema);

export default Company;
