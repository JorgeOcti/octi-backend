"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bluebird = require("bluebird");
const redis = require("redis");
const client = redis.createClient({
    host: process.env.REDIS_HOST ? process.env.REDIS_HOST : 'localhost',
    port: 6379
});
client.on('error', (err) => {
    console.log('Redis Error ' + err);
});
bluebird.promisifyAll(redis);
exports.default = client;
//# sourceMappingURL=redis.service.js.map