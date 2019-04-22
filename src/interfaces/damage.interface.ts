import * as mongoose from 'mongoose';
import {IKind} from './kind.interface';
import {IPart} from './part.interface';
import {IParticipantFile} from './participantFile.interface';
import {IPosition} from './position.interface';
import {ITeam} from './team.interface';

export interface IDamages {
  _id: any;
  name: string;
  team: ITeam | any;
  parts: mongoose.Types.Array<IPart>;
  kinds: mongoose.Types.Array<IKind>;
  positions: mongoose.Types.Array<IPosition>;
}

export interface IDamageSelected {
  _id: any;
  part: string;
  kind: string;
  position: string;
  images: IParticipantFile[];
}
