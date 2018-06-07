import * as mongoose from 'mongoose';
import {IVenue} from "../../interfaces/venue.interface";
import * as mongoosePaginate from 'mongoose-paginate';

export interface IVenueModel extends IVenue, mongoose.Document {}

const venueSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});
mongoose.plugin(mongoosePaginate);

const Venue = mongoose.model<IVenueModel>('Venue', venueSchema);

export default Venue;
