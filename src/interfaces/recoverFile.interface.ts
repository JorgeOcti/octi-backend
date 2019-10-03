import {ICompanyModel} from '../app/models/company.model';
import {IUserModel} from '../app/models/user.model';
import {ITeamModel} from "../app/models/team.model";

interface IIFile {
  url: string;
  type: string;
  name: string;
  size: number;
}

export interface IRecoverFile {
  _id: any;
  team: ITeamModel;
  company: ICompanyModel;
  user: IUserModel;
  file: IIFile;
}
