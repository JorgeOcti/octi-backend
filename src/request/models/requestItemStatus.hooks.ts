import type { IRequestItemStatusModel } from './requestItemStatus.model';
import * as mongoose from 'mongoose';

class RequestItemStatusHooks {

  constructor() {
    this.postFindOneAndUpdateHandler = this.postFindOneAndUpdateHandler.bind(this);
  }

  public async postFindOneAndUpdateHandler(doc: IRequestItemStatusModel): Promise<void> {
    const status = await mongoose.connection.db.collection('requestitemstatuses').findOne({ _id: doc._id });
    if (status) {
      await mongoose.connection.db.collection('requestitems').updateMany(
        { 'meta.status._id': doc._id },
        { $set: { 'meta.status': status } }
      );
    }
  }
}

const requestItemStatusHooks = new RequestItemStatusHooks();
export default requestItemStatusHooks;
