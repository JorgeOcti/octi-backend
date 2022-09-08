/* queues */
import * as kue from "kue";
import {createRedisClient} from "../services/redis.service";

export const queue = kue.createQueue({
  redis: {
    createClientFactory: () => {
      return createRedisClient();
    }
  }
});
