import * as bluebird from 'bluebird';
import * as redis from 'redis';

const client = redis.createClient({
  host: process.env.REDIS_HOST ? process.env.REDIS_HOST : 'localhost',
  port: 6379
});

/* istanbul ignore next */
client.on('error', (err) => {
  console.log('Redis Error ' + err);
});

bluebird.promisifyAll(redis);

export default client;
