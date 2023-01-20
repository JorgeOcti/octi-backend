import type { ICompanyModel } from '../models/company.model';
import type { ITeamModel } from '../models/team.model';
import type { IUserModel } from '../schemas/user.schema';

interface IIFile {
  url: string;
  type: string;
  name: string;
  size: number;
}

export interface IRecoverFile {
  _id?: any;
  team: ITeamModel;
  company: ICompanyModel;
  user: IUserModel;
  file: IIFile;
}
