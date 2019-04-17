import * as mongoose from 'mongoose';
import {IPart} from '../../interfaces/part.interface';

export interface IPartModel extends IPart, mongoose.Document {}
export const partSchema = new mongoose.Schema({
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  name: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

const Part = mongoose.model<IPartModel>('Part', partSchema);
export default Part;
