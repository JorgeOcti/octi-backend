import {IFormModel} from "../form/models/form.model";
import {ICompanyModel} from "../app/models/company.model";
import {IUserModel} from "../app/models/user.model";

interface IIFile {
  url: string;
  type: string,
  name: string,
  size: number,
}

export interface IParticipantFile {
  _id: any;
  form: IFormModel;
  company: ICompanyModel;
  user: IUserModel;
  file: IIFile;
}
