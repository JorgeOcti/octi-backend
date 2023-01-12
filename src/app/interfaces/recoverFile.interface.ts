import {ICompanyModel} from '../models/company.model';
import {ITeamModel} from '../models/team.model';
import {IUserModel} from '../models/user.model';

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
