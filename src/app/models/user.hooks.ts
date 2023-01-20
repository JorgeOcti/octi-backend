import mongooseRaw from '../../mongoRaw';
import requestItemsMeta from '../../request/models/requestIteam.meta';
import { IUserModel } from '../schemas/user.schema';

class UserHooks {

  constructor() {
    this.postFindOneAndUpdateHandler = this.postFindOneAndUpdateHandler.bind(this);
  }

  public async postFindOneAndUpdateHandler(doc: IUserModel): Promise<void> {
    const user = await mongooseRaw.connection.db.collection('users').findOne({ _id: doc._id });
    if (user) {
      await mongooseRaw.connection.db.collection('requestitems').updateMany(
        { 'createdBy': doc._id },
        { $set: { 'meta.user': requestItemsMeta.processUser(user) } }
      );
    }
  }
}

const usersHooks = new UserHooks();
export default usersHooks;
