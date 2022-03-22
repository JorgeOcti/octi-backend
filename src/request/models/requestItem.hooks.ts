import Request from './request.model';
import RequestItem, { IRequestItemModel } from './requestItem.model';
import Car from '../../app/models/car.model';
import User from '../../app/models/user.model';
import Venue from '../../app/models/venue.model';
import RequestItemStatus from './requestItemStatus.model';

class RequestItemHooks {

  constructor() {
    this.postFindOneAndUpdateHandler = this.postFindOneAndUpdateHandler.bind(this);
  }

  public async postFindOneAndUpdateHandler(doc: IRequestItemModel): Promise<void> {
    console.log('doc.request', doc.request);
    const request = await Request.findById(doc.request);
    if (request) {
      const car = await Car.findById(doc.car);
      const user = await User.findById(doc.createdBy);
      const origin = await Venue.findById(doc.origin);
      const destination = await Venue.findById(doc.destination);
      const status = await RequestItemStatus.findById(doc.status);
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
