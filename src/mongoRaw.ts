import * as bluebird from 'bluebird';
import * as mongoose from 'mongoose';

const MONGODB_URI: string = process.env.MONGODB_URI || '';

// Mongoose connect
(mongoose as any).Promise = bluebird;
mongoose.connect(MONGODB_URI, { }, (err: any) => {
  if (err) {
    /* istanbul ignore next */
    console.log('Unable to connect to the mongodb instance. Error: ', err);
    throw err;
  }
});
mongoose.set('debug', true);

export default mongoose;
