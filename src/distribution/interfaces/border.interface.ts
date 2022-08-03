import {ICompany, ITeam} from "../../app/interfaces";

export interface IBorder {
  _id: any;
  name: string;
  lat: number;
  lng: number;
  company?: ICompany | any;
  team?: ITeam | any;
}
