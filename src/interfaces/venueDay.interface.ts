import {IVenue} from "./venue.interface";

export interface IVenueDay {
  _id: any;
  shippingMaxDays: number | undefined;
  venue: IVenue;
}
