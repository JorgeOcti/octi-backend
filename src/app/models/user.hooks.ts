import { IUserModel } from '../../app/models/user.model';
import { mongooseRaw } from '../../server';

class UserHooks {

  constructor() {
    this.postFindOneAndUpdateHandler = this.postFindOneAndUpdateHandler.bind(this);
  }

  public async postFindOneAndUpdateHandler(doc: IUserModel): Promise<void> {
    const user = await mongooseRaw.connection.db.collection('users').findOne({ _id: doc._id });
    if (user) {
      await mongooseRaw.connection.db.collection('requestitems').updateMany(
        { 'meta.user._id': doc._id },
        { $set: { 'meta.user': user } }
      );
    }
  }
}

const usersHooks = new UserHooks();
export default usersHooks;
