import * as mongoose from 'mongoose';
import {IIFile} from './inventoryFile.interface';
import {IKind} from './kind.interface';
import {IPart} from './part.interface';
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
  images: IIFile[];
}
