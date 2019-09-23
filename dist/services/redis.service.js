"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bluebird = require("bluebird");
const redis = require("redis");
const RedisClustr = require("redis-clustr");
const general_utils_1 = require("../utils/general.utils");
let client;
if (process.env.REDIS_CLUSTERED === "true") {
    console.log("REDIS CLUSTER ON");
    client = new RedisClustr({
        servers: [{
                host: general_utils_1.default.getFromEnviroment('REDIS_SERVICE_SERVICE_HOST', 'localhost'),
                port: 6379
            }],
        createClient: function (port, host) {
            // this is the default behaviour
            return redis.createClient(port, host);
        }
    });
}
else {
    console.log("REDIS CLUSTER OFF");
    client = redis.createClient({
        host: general_utils_1.default.getFromEnviroment('REDIS_SERVICE_SERVICE_HOST', 'localhost'),
        port: 6379
    });
}
/* istanbul ignore next */
client.on('error', (err) => {
    console.log('Redis Error ' + err);
});
bluebird.promisifyAll(redis);
exports.default = client;
//# sourceMappingURL=redis.service.js.map