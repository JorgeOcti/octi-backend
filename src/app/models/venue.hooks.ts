import * as mongoose from 'mongoose';
import requestItemsMeta from '../../request/models/requestIteam.meta';
import type { IVenueModel } from './venue.model';

class VenueHooks {
  constructor() {
    this.postFindOneAndUpdateHandler =
      this.postFindOneAndUpdateHandler.bind(this);
  }

  public async postFindOneAndUpdateHandler(doc: IVenueModel): Promise<void> {
    const venue = await mongoose.connection.db
      .collection('venues')
      .findOne({ _id: doc._id });

    if (venue) {
      await mongoose.connection.db
        .collection('requestitems')
        .updateMany(
          { origin: doc._id },
          { $set: { 'meta.origin': requestItemsMeta.processVenue(venue) } }
        );
      await mongoose.connection.db
        .collection('requestitems')
        .updateMany(
          { destination: doc._id },
          { $set: { 'meta.destination': requestItemsMeta.processVenue(venue) } }
        );
    }
  }
}

const venuesHooks = new VenueHooks();
export default venuesHooks;
