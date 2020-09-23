import {ICar} from "./car.interface";
import {IVenue} from "./venue.interface";
import {ICompany} from "./company.interface";
import {ITeam} from "./team.interface";
import {IUser} from "./user.interface";
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
