import Request from './request.model';
import RequestItem, { IRequestItemModel } from './requestItem.model';
import { Car, User, Venue } from '../../app/models';
import RequestItemStatus from './requestItemStatus.model';
import requestItemsMeta from './requestIteam.meta';
import Transmittal from '../../distribution/models/transmittal.model';

class RequestItemHooks {

  constructor() {
    this.postFindOneAndUpdateHandler = this.postFindOneAndUpdateHandler.bind(this);
  }

  public async postFindOneAndUpdateHandler(doc: IRequestItemModel): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      try {
        const request = doc?.request ? await Request.findById(doc.request, { meta: false }) : null;
        if (request) {
          const [car, user, origin, destination, status, transmittal] = await Promise.all([
            Car.findById(doc.car),
            User.findById(doc.createdBy),
            Venue.findById(doc.origin),
            Venue.findById(doc.destination),
            RequestItemStatus.findById(doc.status),
            Transmittal.findById(doc.transmittal)
          ]);
          // await RequestItem.updateOne({ _id: doc._id }, { $unset: { meta: {} } });
          const meta = requestItemsMeta.processMeta({
            request,
            transmittal,
            car,
            user,
            origin,
            destination,
            status
          });
          // if (transmittal) {
            await RequestItem.updateOne({ _id: doc._id }, {
              $set: { meta }
            });
          // }
        }
        resolve();
      } catch (e) {
        reject(e);
      }
    });
  }
}

const requestItemsHooks = new RequestItemHooks();
export default requestItemsHooks;
