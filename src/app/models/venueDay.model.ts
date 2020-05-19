import * as mongoose from 'mongoose';
import {IVenueDay} from "../../interfaces/venueDay.interface";

export interface IVenueDayModel extends IVenueDay, mongoose.Document {}

export const venueDaySchema = new mongoose.Schema({
  venue: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Venue'
  },
  shippingMaxDays: {
    type: Number,
    default: 5
  }
}, {
  timestamps: true
});

const VenueDay = mongoose.model<IVenueDayModel>('VenueDay', venueDaySchema);
export default VenueDay;

