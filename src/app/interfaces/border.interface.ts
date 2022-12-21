import {ICompany, ITeam} from "./index";

export interface IBaseBorder {
  _id?: any;
  name: string;
  lat: number;
  lng: number;
  company?: ICompany | any;
}

export interface IBorder extends IBaseBorder{
  team?: ITeam | any;
  updatedAt?: Date;
  createdAt?: Date;
}
