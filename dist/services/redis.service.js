"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const redis = require("redis");
const bluebird = require("bluebird");
const client = redis.createClient();
client.on('error', (err) => {
    console.log('Redis Error ' + err);
});
bluebird.promisifyAll(redis);
exports.default = client;
//# sourceMappingURL=redis.service.js.map