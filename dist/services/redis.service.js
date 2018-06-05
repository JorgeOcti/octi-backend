"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const redis = require("redis");
const client = redis.createClient();
client.on('error', (err) => {
    console.log('Redis Error ' + err);
});
exports.default = client;
//# sourceMappingURL=redis.service.js.map