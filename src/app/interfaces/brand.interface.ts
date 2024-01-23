import type { ITeam } from './team.interface';

export interface IBrand {
  _id?: any;
  name: string;
  aliases: string[];
  fallback: boolean;
  team: ITeam;
  updatedAt: Date;
  createdAt: Date;
}
