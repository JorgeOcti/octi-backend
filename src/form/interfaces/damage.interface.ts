import * as mongoose from 'mongoose';

import type { ITeam } from '../../app/interfaces/team.interface';
import type { IKind } from './kind.interface';
import type { IPart } from './part.interface';
import type { IParticipantFile } from './participantFile.interface';
import type { IPosition } from './position.interface';

export interface IDamages {
  _id?: any;
  name: string;
  team: ITeam | any;
  parts: mongoose.Types.Array<IPart>;
  kinds: mongoose.Types.Array<IKind>;
  positions: mongoose.Types.Array<IPosition>;
  severityOptions: [string];
  kindFallback: IPart;
  partFallback: IKind;
}

export interface IDamageSelected {
  _id: any;
  part: string;
  kind: string;
  position: string;
  severity: string;
  images: IParticipantFile[];
}
