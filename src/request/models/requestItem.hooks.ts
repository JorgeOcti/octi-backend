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
        const [
          request, car, user, origin, destination, status, transmittal
        ] = await Promise.all([
          Request.findById(doc?.request, { meta: false }),
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
        if (doc._id.toString() === '62addbba0596900010143714') {
          console.log('meta', meta);
          console.log('doc', doc);
        }
        await RequestItem.updateOne({ _id: doc._id }, {
          $set: { meta }
        });
        // }
        resolve();
      } catch (e) {
        reject(e);
      }
    });
  }
}

const requestItemsHooks = new RequestItemHooks();
export default requestItemsHooks;
