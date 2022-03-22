import Request from './request.model';
import RequestItem, { IRequestItemModel } from './requestItem.model';
import Car from '../../app/models/car.model';
import User from '../../app/models/user.model';

class RequestItemHooks {

  constructor() {
    this.postFindOneAndUpdateHandler = this.postFindOneAndUpdateHandler.bind(this);
  }

  public async postFindOneAndUpdateHandler(doc: IRequestItemModel): Promise<void> {
    console.log('doc.request', doc.request);
    const request = await Request.findById(doc.request);
    const car = await Car.findById(doc.car);
    const user = await User.findById(doc.createdBy);
    await RequestItem.updateMany({ request: request }, { meta: { request, car, user } });
  }
}

const requestItemsHooks = new RequestItemHooks();
export default requestItemsHooks;
