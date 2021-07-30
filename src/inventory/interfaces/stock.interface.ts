import {ICar} from "../../app/interfaces/car.interface";
import {IVenue} from "../../app/interfaces/venue.interface";
import {ICompany} from "../../app/interfaces/company.interface";
import {ITeam} from "../../app/interfaces/team.interface";
import {IUser} from "../../app/interfaces/user.interface";
import * as mongoose from "mongoose";

export interface IStockCar {
  car: ICar;
  stock?: mongoose.Schema.Types.ObjectId;
  venue: IVenue;
  updatedAt?: Date;
  createdAt?: Date;
}

export interface IStock {
  company: ICompany;
  team: ITeam;
  createdBy: IUser;
  updatedAt?: Date;
  createdAt?: Date;
}
