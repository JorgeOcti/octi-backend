import * as mongoose from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate';
import {ITeam} from '../../interfaces/team.interface';

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
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

teamSchema.virtual('users', {
  ref: 'User', // The model to use
  localField: '_id', // Find field in this model
  foreignField: 'team', // is equal to field in another model
  justOne: false
});

teamSchema.plugin(mongoosePaginate);

const Team = mongoose.model<ITeamModel>('Team', teamSchema);

export default Team;
