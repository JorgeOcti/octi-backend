import mongooseRaw from '../../mongoRaw';
import { IVenueModel } from './venue.model';
import requestItemsMeta from '../../request/models/requestIteam.meta';

class VenueHooks {

  constructor() {
    this.postFindOneAndUpdateHandler = this.postFindOneAndUpdateHandler.bind(this);
  }

  public async postFindOneAndUpdateHandler(doc: IVenueModel): Promise<void> {
    const venue = await mongooseRaw.connection.db.collection('venues').findOne({ _id: doc._id });
    console.log(venue);
    if (venue) {
      await mongooseRaw.connection.db.collection('requestitems').updateMany(
        { 'origin': doc._id },
        { $set: { 'meta.origin': requestItemsMeta.processVenue(venue) } }
      );
      await mongooseRaw.connection.db.collection('requestitems').updateMany(
        { 'destination': doc._id },
        { $set: { 'meta.destination': requestItemsMeta.processVenue(venue) } }
      );
    }
  }
}

const venuesHooks = new VenueHooks();
export default venuesHooks;
