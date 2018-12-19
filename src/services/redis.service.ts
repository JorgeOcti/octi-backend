import * as bluebird from 'bluebird';
import * as redis from 'redis';
import GeneralUtils from '../utils/general.utils';

const client = redis.createClient({
  host: GeneralUtils.getFromEnviroment('REDIS_HOST', 'localhost'),
  port: 6379
});

/* istanbul ignore next */
client.on('error', (err) => {
  console.log('Redis Error ' + err);
});

bluebird.promisifyAll(redis);

export default client;
