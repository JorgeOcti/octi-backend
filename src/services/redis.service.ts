import * as redis from 'redis';
import * as bluebird from 'bluebird';

const client = redis.createClient();

client.on('error', (err) => {
  console.log('Redis Error ' + err);
});

bluebird.promisifyAll(redis);

export default client;
