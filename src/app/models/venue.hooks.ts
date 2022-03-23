import { mongooseRaw } from '../../server';
import { IVenueModel } from './venue.model';

class VenueHooks {

  constructor() {
    this.postFindOneAndUpdateHandler = this.postFindOneAndUpdateHandler.bind(this);
  }

  public async postFindOneAndUpdateHandler(doc: IVenueModel): Promise<void> {
    const venue = await mongooseRaw.connection.db.collection('venues').findOne({ _id: doc._id });
    if (venue) {
      await mongooseRaw.connection.db.collection('requestitems').updateMany(
        { 'meta.origin._id': doc._id },
        { $set: { 'meta.origin': venue } }
      );
      await mongooseRaw.connection.db.collection('requestitems').updateMany(
        { 'meta.destination._id': doc._id },
        { $set: { 'meta.destination': venue } }
      );
    }
  }
}

const venuesHooks = new VenueHooks();
export default venuesHooks;
