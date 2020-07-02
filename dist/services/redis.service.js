"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRedisClient = void 0;
const bluebird = require("bluebird");
// import * as redis from 'redis';
const Redis = require("ioredis");
const general_utils_1 = require("../utils/general.utils");
function createRedisClient() {
    let client;
    if (process.env.REDIS_CLUSTERED === "true") {
        console.log("REDIS CLUSTER ON");
        client = new Redis.Cluster([{
                host: general_utils_1.default.getFromEnviroment('REDIS_SERVICE_SERVICE_HOST', 'localhost'),
                port: 6379,
            }]);
    }
    else {
        console.log("REDIS CLUSTER OFF");
        client = new Redis({
            host: general_utils_1.default.getFromEnviroment('REDIS_SERVICE_SERVICE_HOST', 'localhost'),
            port: 6379,
            db: 0
        });
    }
    return client;
}
exports.createRedisClient = createRedisClient;
let client = createRedisClient();
/* istanbul ignore next */
client.on('error', (err) => {
    console.log('Redis Error ' + err);
});
/* istanbul ignore next */
client.on('connect', () => {
    console.log('Redis Connected');
});
bluebird.promisifyAll(Redis);
exports.default = client;
//# sourceMappingURL=redis.service.js.map