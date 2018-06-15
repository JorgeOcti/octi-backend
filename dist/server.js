"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bluebird = require("bluebird");
const mongoose = require("mongoose");
const app_1 = require("./app");
const logger_service_1 = require("./services/logger.service");
const socketIO = require("socket.io");
const socketRedis = require("socket.io-redis");
// Mongoose setting
const MONGODB_URI = process.env.MONGODB_URI || '';
// Mongoose connect
mongoose.connect(MONGODB_URI, { useMongoClient: true }, (err) => {
    if (err) {
        console.log('Unable to connect to the mongodb instance. Error: ', err);
        // throw err;
    }
    /* istanbul ignore if */
    if (app_1.default.get('env') !== 'testing') {
        console.log('Mongoose Successfully connected');
    }
});
mongoose.Promise = bluebird;
// mongoose.Promise = global.Promise;
mongoose.set('debug', app_1.default.get('env') !== 'testing');
// mongoose.set('debug', false);
const NODE_APP_INSTANCE = parseInt(process.env.NODE_APP_INSTANCE) || 0;
const server = app_1.default.listen(parseInt(app_1.default.get('port')) + NODE_APP_INSTANCE, () => {
    /* istanbul ignore if */
    if (app_1.default.get('env') !== 'testing') {
        console.log(`${logger_service_1.default.colors.magenta}----------------------${logger_service_1.default.colors.reset}`);
        console.log(`${logger_service_1.default.colors.brighCyan}OSA-ANDES ${logger_service_1.default.colors.white}v1.0.0 ${logger_service_1.default.colors.brighGreen}RELEASE${logger_service_1.default.colors.reset}`);
        console.log(`${logger_service_1.default.colors.magenta}----------------------${logger_service_1.default.colors.reset}`);
        console.log('is running at http://localhost:%s in %s mode', app_1.default.get('port'), app_1.default.get('env'));
        console.log(`${logger_service_1.default.colors.brightBlack}Press CTRL-C to stop${logger_service_1.default.colors.reset}`);
    }
});
exports.io = socketIO(server);
exports.io.adapter(socketRedis({ host: 'localhost', port: 6379 }));
exports.io.on("connection", function (socket) {
    console.log('socket.id', socket.id);
    console.log("A user connected");
    socket.on('private message', function (from, msg) {
        console.log('I received a private message by ', from, ' saying ', msg);
    });
    socket.on('disconnect', function () {
        console.log("user disconnected");
        // io.emit('user disconnected');
    });
});
exports.default = server;
//# sourceMappingURL=server.js.map