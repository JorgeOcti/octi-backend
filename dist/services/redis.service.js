"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bluebird = require("bluebird");
const redis = require("redis");
const general_utils_1 = require("../utils/general.utils");
const client = redis.createClient({
    host: general_utils_1.default.getFromEnviroment('REDIS_SERVICE_SERVICE_HOST', 'localhost'),
    port: 6379
});
/* istanbul ignore next */
client.on('error', (err) => {
    console.log('Redis Error ' + err);
});
bluebird.promisifyAll(redis);
exports.default = client;
//# sourceMappingURL=redis.service.js.map