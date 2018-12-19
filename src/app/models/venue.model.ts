import * as mongoose from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate';
import {IVenue} from '../../interfaces/venue.interface';

export interface IVenueModel extends IVenue, mongoose.Document {}

export enum ChoicesTypeVenue {
  distributor = 'distributor',
  receiver = 'receiver'
}

export const choicesStatusCarInventory = [
  ChoicesTypeVenue.distributor,
  ChoicesTypeVenue.receiver
];

const venueSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  },
  type: {
    type: String,
    enum: choicesStatusCarInventory,
    default: ChoicesTypeVenue.receiver
  },
  deleted: {
    type: Boolean,
    default: false
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

mongoose.plugin(mongoosePaginate);

venueSchema.virtual('users', {
  ref: 'User', // The model to use
  localField: '_id', // Find field in this model
  foreignField: 'venue', // is equal to field in another model
  justOne: false
});

venueSchema.virtual('participants', {
  ref: 'Participant', // The model to use
  localField: '_id', // Find field in this model
  foreignField: 'venue', // is equal to field in another model
  justOne: false
});

const Venue = mongoose.model<IVenueModel>('Venue', venueSchema);

export default Venue;
