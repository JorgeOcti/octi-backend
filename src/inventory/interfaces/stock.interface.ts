import * as mongoose from "mongoose";
import type { ICar } from "../../app/interfaces/car.interface";
import type { ICompany } from "../../app/interfaces/company.interface";
import type { ITeam } from "../../app/interfaces/team.interface";
import type { IUser } from "../../app/interfaces/user.interface";
import type { IVenue } from "../../app/interfaces/venue.interface";

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
