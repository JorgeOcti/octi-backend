import { ICompany } from './company.interface';
import { IInventoryCar } from '../../inventory/interfaces/inventory.interface';
import { IParticipant } from '../../form/interfaces/participant.interface';
import { ITeam } from './team.interface';
import { IUser } from './user.interface';
import { IVenue } from './venue.interface';
import { IHistory } from './history.interface';

export interface ICarLocation {
  venue: IVenue;
  checkedDate: Date;
}

export interface ICar {
  _id: any;
  meta: {
    location: ICarLocation;
  };
  internalNumber: string;
  patent: string;
  engineNumber: string;
  engineSize: string;
  driveType: string;
  vin: string;
  vin2: string;
  imported: boolean;
  brand: string;
  denomination: string;
  material: string;
  destination: string;
  property: string;
  type: string;
  isExhibition: boolean;
  invoice: string;
  businessYear: Date;
  manufacturingYear: Date;
  price: string;
  insurancePrice: string;
  weight: string;
  countryOrigin: string;
  gas: string;
  ap: string;
  entry: string;
  bl: string;
  client: string;
  color: string;
  firstColorOption: string;
  shippingDate: Date;
  secondColorOption: string;
  thirdColorOption: string;
  team: ITeam | any;
  company: ICompany | any;
  lastForm: IParticipant | any;
  participants?: IParticipant[];
  inventories?: IInventoryCar[];
  status: string;
  event: IHistory;
  events: IHistory[];
  createdBy?: IUser;
  updatedAt: Date;
  createdAt: Date;
}
