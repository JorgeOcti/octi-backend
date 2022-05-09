import { IRequestItemStatusModel } from './requestItemStatus.model';
import mongooseRaw from '../../mongoRaw';

class RequestItemStatusHooks {

  constructor() {
    this.postFindOneAndUpdateHandler = this.postFindOneAndUpdateHandler.bind(this);
  }

  public async postFindOneAndUpdateHandler(doc: IRequestItemStatusModel): Promise<void> {
    const status = await mongooseRaw.connection.db.collection('requestitemstatuses').findOne({ _id: doc._id });
    if (status) {
      await mongooseRaw.connection.db.collection('requestitems').updateMany(
        { 'meta.status._id': doc._id },
        { $set: { 'meta.status': status } }
      );
    }
  }
}

const requestItemStatusHooks = new RequestItemStatusHooks();
export default requestItemStatusHooks;
