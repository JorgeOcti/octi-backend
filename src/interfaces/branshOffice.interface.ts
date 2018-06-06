import {ICompany} from "./company.interface";

export interface IBranchOffice {
  _id: any;
  name: string;
  company: ICompany | any;
  active: boolean;
  updatedAt: Date;
  createdAt: Date;
}
