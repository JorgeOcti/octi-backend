import Request from './request.model';
import RequestItem, { IRequestItemModel } from './requestItem.model';
import { Car, User, Venue } from '../../app/models';
import RequestItemStatus from './requestItemStatus.model';

class RequestItemHooks {

  constructor() {
    this.postFindOneAndUpdateHandler = this.postFindOneAndUpdateHandler.bind(this);
  }

  public async postFindOneAndUpdateHandler(doc: IRequestItemModel): Promise<void> {
    const request = await Request.findById(doc.request);
    if (request) {
      const [car, user, origin, destination, status] = await Promise.all([
        Car.findById(doc.car),
        User.findById(doc.createdBy),
        Venue.findById(doc.origin),
        Venue.findById(doc.destination),
        RequestItemStatus.findById(doc.status)
      ]);
      await RequestItem.updateMany({ request: request }, {
        meta: {
          request,
          car,
          user,
          origin,
          destination,
          status
        }
      });
    }
  }
}

const requestItemsHooks = new RequestItemHooks();
export default requestItemsHooks;
