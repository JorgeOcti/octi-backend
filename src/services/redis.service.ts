import Redis, { Cluster } from 'ioredis';
import GeneralUtils from '../utils/general.utils';

let client: Redis | Cluster;

export function createRedisClient(): Redis | Cluster {
  if (client) {
    return client.duplicate();
  } else {
    if (process.env.REDIS_CLUSTERED === 'true') {
      // console.log("REDIS CLUSTER ON");
      client = new Cluster(
        [
          {
            host: GeneralUtils.getFromEnviroment(
              'REDIS_SERVICE_SERVICE_HOST',
              'localhost'
            ),
            port: 6379
          }
        ],
        {
          slotsRefreshTimeout: 2000,
          enableReadyCheck: false
        }
      );
    } else {
      // console.log("REDIS CLUSTER OFF");
      client = new Redis({
        host: GeneralUtils.getFromEnviroment(
          'REDIS_SERVICE_SERVICE_HOST',
          'localhost'
        ),
        port: 6379,
        db: 0,
        maxRetriesPerRequest: null,
        enableReadyCheck: false
      });
    }
  }
  return client;
}
client = createRedisClient();

/* istanbul ignore next */
client.on('error', (err: any) => {
  console.log('Redis Error ' + err);
});
/* istanbul ignore next */
client.on('connect', () => {
  console.log('Redis Successfully connected');
});

export default client;
