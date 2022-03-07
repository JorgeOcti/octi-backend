import Request from './request.model';
import RequestItem, { IRequestItemModel } from './requestItem.model';

class RequestItemHooks {

  constructor() {
    this.postUpdateHandler = this.postUpdateHandler.bind(this);
  }

  public async postUpdateHandler(doc: IRequestItemModel): Promise<void> {
    console.log('doc.request', doc.request);
    const request = await Request.findById(doc.request);
    if (request) {
      await RequestItem.updateMany({ request: request }, { meta: { request } });
    } else {
      console.error(`Item no tiene request`);
      console.error(doc);
    }
  }
}

const requestItemsHooks = new RequestItemHooks();
export default requestItemsHooks;
