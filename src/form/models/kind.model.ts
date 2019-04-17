import * as mongoose from 'mongoose';
import {IKind} from '../../interfaces/kind.interface';

export interface IKindModel extends IKind, mongoose.Document {}
export const kindSchema = new mongoose.Schema({
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

const Kind = mongoose.model<IKindModel>('Kind', kindSchema);
export default Kind;
