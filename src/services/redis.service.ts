import * as bluebird from 'bluebird';
import * as redis from 'redis';
import * as RedisClustr from 'redis-clustr';
import GeneralUtils from '../utils/general.utils';

let client: any;
if (process.env.REDIS_CLUSTERED === "true") {
  client = new RedisClustr({
    servers: [{
      host: GeneralUtils.getFromEnviroment('REDIS_SERVICE_SERVICE_HOST', 'localhost'),
      port: 6379
    }],
    createClient: function (port: number, host: string) {
      // this is the default behaviour
      return redis.createClient(port, host);
    }
  });
} else {
  client = redis.createClient({
    host: GeneralUtils.getFromEnviroment('REDIS_SERVICE_SERVICE_HOST', 'localhost'),
    port: 6379
  });
}

/* istanbul ignore next */
client.on('error', (err: any) => {
  console.log('Redis Error ' + err);
});

bluebird.promisifyAll(redis);

export default client;
