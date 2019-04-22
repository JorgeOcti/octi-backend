import * as mongoose from 'mongoose';
import {IPosition} from '../../interfaces/position.interface';

export interface IPositionModel extends IPosition, mongoose.Document {}
export const positionSchema = new mongoose.Schema({
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

const Position = mongoose.model<IPositionModel>('Position', positionSchema);
export default Position;
