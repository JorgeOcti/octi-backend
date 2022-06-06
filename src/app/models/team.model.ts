import * as mongoose from 'mongoose';
import { PaginateModel } from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate';
import { ITeam } from '../interfaces';

export interface ITeamModel extends ITeam, mongoose.Document {}

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: true
  },
  formsNumber: {
    type: Number,
    default: 0
  },
  requestNumber: {
    type: Number,
    default: 0
  },
  transmittalNumber: {
    type: Number,
    default: 0
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

teamSchema.set<any>('expires', 30);

teamSchema.virtual('companies', {
  ref: 'Company', // The model to use
  localField: '_id', // Find field in this model
  foreignField: 'team', // is equal to field in another model
  justOne: false
});

teamSchema.virtual('users', {
  ref: 'User', // The model to use
  localField: '_id', // Find field in this model
  foreignField: 'team', // is equal to field in another model
  justOne: false
});

teamSchema.virtual('settings', {
  ref: 'TeamSetting', // The model to use
  localField: '_id', // Find field in this model
  foreignField: 'team', // is equal to field in another model
  justOne: true
});

teamSchema.virtual('histories', {
  ref: 'ActivityHistory', // The model to use
  localField: '_id', // Find field in this model
  foreignField: 'team', // is equal to field in another model
  justOne: true
});


teamSchema.plugin(mongoosePaginate);

export type TeamSchema = mongoose.Model<ITeamModel> & PaginateModel<ITeamModel>;

const Team = mongoose.model<ITeamModel, TeamSchema>('Team', teamSchema);

export default Team;
