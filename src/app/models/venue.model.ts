import * as mongoose from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate-v2';

import { PaginateModel } from 'mongoose';
import type { IVenue } from '../interfaces/venue.interface';
import venuesHooks from './venue.hooks';
import { venueDaySchema } from './venueDay.model';

export interface IVenueModel extends IVenue, mongoose.Document<any> { }

export enum ChoicesTypeVenue {
  distributor = 'distributor',
  receiver = 'receiver'
}

export const choicesStatusCarInventory = [
  ChoicesTypeVenue.distributor,
  ChoicesTypeVenue.receiver
];

export const baseVenueSchema = new mongoose.Schema({
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
});

export const venueSchema = new mongoose.Schema({
  ...baseVenueSchema.obj,
  code: {
    type: String,
  },
  abbreviation: {
    type: String,
  },
  lat: {
    type: Number,
    default: 0
  },
  lng: {
    type: Number,
    default: 0
  },
  region: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Region'
  },
  shippingMaxDays: {
    type: Number,
    default: 5
  },
  type: {
    type: String,
    enum: choicesStatusCarInventory,
    default: ChoicesTypeVenue.receiver
  },
  sendToDays: {
    type: [venueDaySchema]
  },
  sendTo: {
    type: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Venue'
    }],
    default: []
  },
  receiveFrom: {
    type: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Venue'
    }],
    default: []
  },
  receptionCarriers: {
    type: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Carrier'
    }],
    default: []
  },
  shippingCarriers: {
    type: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Carrier'
    }],
    default: []
  },
  responsible: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
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

venueSchema.set<any>('redisCache', process.env.ENV === 'production');
venueSchema.set<any>('expires', 30);

venueSchema.index({ 'sendTo': 1 });
venueSchema.index({ 'receiveFrom': 1 });
venueSchema.index({ 'responsible': 1 });
venueSchema.index({ 'team': 1, name: 1 });
venueSchema.index({ 'team': 1, deleted: 1 });


mongoose.plugin(mongoosePaginate);

venueSchema.post<IVenueModel>('findOneAndUpdate', async (doc: any) => {
  await venuesHooks.postFindOneAndUpdateHandler(doc);
});

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

export type VenueSchema = mongoose.Model<IVenueModel> & PaginateModel<IVenueModel>;

export const Venue = mongoose.model<IVenueModel, VenueSchema>('Venue', venueSchema);

export default Venue;
