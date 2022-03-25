import Request from './request.model';
import RequestItem, { IRequestItemModel } from './requestItem.model';
import { Car, User, Venue } from '../../app/models';
import RequestItemStatus from './requestItemStatus.model';
import requestItemsMeta from './requestIteam.meta';

class RequestItemHooks {

  constructor() {
    this.postFindOneAndUpdateHandler = this.postFindOneAndUpdateHandler.bind(this);
  }

  public async postFindOneAndUpdateHandler(doc: IRequestItemModel): Promise<void> {
    const request = await Request.findById(doc.request, { meta: false });
    if (request) {
      const [car, user, origin, destination, status] = await Promise.all([
        Car.findById(doc.car),
        User.findById(doc.createdBy),
        Venue.findById(doc.origin),
        Venue.findById(doc.destination),
        RequestItemStatus.findById(doc.status)
      ]);
      // await RequestItem.updateOne({ _id: doc._id }, { $unset: { meta: {} } });
      const meta = requestItemsMeta.processMeta({
        request,
        car,
        user,
        origin,
        destination,
        status
      });
      console.log(meta);
      await RequestItem.updateOne({ _id: doc._id }, {
        $set: { meta }
      });
    }
  }
}

const requestItemsHooks = new RequestItemHooks();
export default requestItemsHooks;
