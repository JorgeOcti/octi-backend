import { ITeam } from './team.interface';

export interface ISamlConfig {
  _id?: any;
  team: ITeam;
  name: string;
  entryPoint: string;
  issuer: string;
  callbackUrl: string;
  cert: any;
  active: boolean;
  deleted: boolean;
  updatedAt: Date;
  createdAt: Date;
}
