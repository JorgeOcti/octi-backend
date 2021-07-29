import * as bluebird from 'bluebird';
// import * as redis from 'redis';
import * as Redis from 'ioredis';
import GeneralUtils from '../utils/general.utils';


export function createRedisClient(): Redis.Redis | Redis.Cluster{
  let client: Redis.Redis | Redis.Cluster;
  if (process.env.REDIS_CLUSTERED === "true") {
    // console.log("REDIS CLUSTER ON");
    client = new Redis.Cluster([{
      host: GeneralUtils.getFromEnviroment('REDIS_SERVICE_SERVICE_HOST', 'localhost'),
      port: 6379,
    }]);
  } else {
    // console.log("REDIS CLUSTER OFF");
    client = new Redis({
      host: GeneralUtils.getFromEnviroment('REDIS_SERVICE_SERVICE_HOST', 'localhost'),
      port: 6379,
      db: 0
    });
  }
  return client;
}
let client = createRedisClient();

/* istanbul ignore next */
client.on('error', (err: any) => {
  console.log('Redis Error ' + err);
});
/* istanbul ignore next */
client.on('connect', () => {
  console.log('Redis Connected');
});

bluebird.promisifyAll(Redis);

export default client;
