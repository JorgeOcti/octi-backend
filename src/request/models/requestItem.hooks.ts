import { Car } from '../../app/models/car.model';
import { User } from '../../app/models/user.model';
import { Venue } from '../../app/models/venue.model';
import Transmittal from '../../distribution/models/transmittal.model';
import Request from './request.model';
import requestItemsMeta from './requestIteam.meta';
import RequestItemStatus from './requestItemStatus.model';

class RequestItemHooks {
  constructor() {
    this.postFindOneAndUpdateHandler =
      this.postFindOneAndUpdateHandler.bind(this);
  }

  public async postFindOneAndUpdateHandler(doc: any): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      try {
        const [request, user, car, origin, destination, status, transmittal] =
          await Promise.all([
            doc?.request
              ? Request.findById(doc?.request, { meta: false })
              : new Promise((resolve) => resolve(null)),
            doc?.createdBy
              ? User.findById(doc.createdBy)
              : new Promise((resolve) => resolve(null)),
            doc?.car
              ? Car.findById(doc.car)
              : new Promise((resolve) => resolve(null)),
            doc?.origin
              ? Venue.findById(doc?.origin, { meta: false })
              : new Promise((resolve) => resolve(null)),
            doc?.destination
              ? Venue.findById(doc?.destination, { meta: false })
              : new Promise((resolve) => resolve(null)),
            doc?.status
              ? RequestItemStatus.findById(doc?.status, { meta: false })
              : new Promise((resolve) => resolve(null)),
            doc?.transmittal
              ? Transmittal.findById(doc?.transmittal, { meta: false })
              : new Promise((resolve) => resolve(null))
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
        if (doc?._id?.toString() === '62addbba0596900010143714') {
          console.log('meta', meta);
          console.log('doc', doc);
        }
        doc.meta = meta;
        await doc.save();
        resolve();
      } catch (e) {
        console.error(e);
        reject(e);
      }
    });
  }
}

const requestItemsHooks = new RequestItemHooks();
export default requestItemsHooks;
