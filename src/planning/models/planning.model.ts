import * as mongoose from 'mongoose';
import {IPlanning} from '../../interfaces/planning.interface';
import * as mongoosePaginate from 'mongoose-paginate';

export interface IPlanningModel extends IPlanning, mongoose.Document {}

const planningSchema = new mongoose.Schema({
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  },
  car: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Car'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  date: {
    type: Date,
    default: new Date()
  }
}, {
  timestamps: true
});

planningSchema.plugin(mongoosePaginate);

const Planning = mongoose.model<IPlanningModel>('Planning', planningSchema);

export default Planning;
