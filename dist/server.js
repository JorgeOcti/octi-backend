"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bluebird = require("bluebird");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const socketIO = require("socket.io");
const socketRedis = require("socket.io-redis");
const app_1 = require("./app");
const logger_service_1 = require("./services/logger.service");
const redis_service_1 = require("./services/redis.service");
// Mongoose setting
const MONGODB_URI = process.env.MONGODB_URI || '';
// Mongoose connect
mongoose.Promise = bluebird;
mongoose.connect(MONGODB_URI, {
    useMongoClient: true
}, (err) => {
    if (err) {
        /* istanbul ignore next */
        console.log('Unable to connect to the mongodb instance. Error: ', err);
        throw err;
    }
    /* istanbul ignore if */
    if (app_1.default.get('env') !== 'testing') {
        console.log('Mongoose Successfully connected');
    }
});
mongoose.set('debug', app_1.default.get('env') === 'development');
const NODE_APP_INSTANCE = parseInt(process.env.NODE_APP_INSTANCE, 10) || 0;
const server = app_1.default.listen(parseInt(app_1.default.get('port'), 10) + NODE_APP_INSTANCE, () => {
    /* istanbul ignore if */
    if (app_1.default.get('env') !== 'testing') {
        console.log(`${logger_service_1.default.colors.magenta}------------------------${logger_service_1.default.colors.reset}`);
        console.log(`${logger_service_1.default.colors.brighCyan}OSA-ANDES ${logger_service_1.default.colors.white}v2.1.3 ${logger_service_1.default.colors.brighGreen}RELEASE${logger_service_1.default.colors.reset}`);
        console.log(`${logger_service_1.default.colors.magenta}------------------------${logger_service_1.default.colors.reset}`);
        console.log('is running at http://localhost:%s in %s mode', app_1.default.get('port'), app_1.default.get('env'));
        console.log(`${logger_service_1.default.colors.brightBlack}Press CTRL-C to stop${logger_service_1.default.colors.reset}`);
    }
});
exports.io = socketIO(server);
exports.io.adapter(socketRedis({
    host: process.env.REDIS_SERVICE_SERVICE_HOST ? process.env.REDIS_SERVICE_SERVICE_HOST : 'localhost',
    port: 6379
}));
/* istanbul ignore next */
exports.io.use(async (socket, next) => {
    // validate token to use socket
    const token = socket.handshake.query.token;
    const msgErrorAuthentication = 'authentication error';
    if (token) {
        try {
            const user = await jwt.verify(token, process.env.SECRET_KEY || 'secretKey');
            if (user) {
                // socket: generate user room
                socket.user = user;
                socket.join(user._id);
                return next();
            }
            else {
                socket.disconnect();
                return next(new Error(msgErrorAuthentication));
            }
        }
        catch (e) {
            socket.disconnect();
            return next(new Error(msgErrorAuthentication));
        }
    }
    else {
        socket.disconnect();
        return next(new Error(msgErrorAuthentication));
    }
    // console.log('token', token);
    // if (isValid(token)) {
    //   return next();
    // }
    // return next(new Error('authentication error'));
});
/* istanbul ignore next */
exports.io.on('connection', async (socket) => {
    // logger.info(`socket.connection: {user: ${JSON.stringify((socket as any).user)}}`);
    socket.on('join', (data) => {
        const { room } = data;
        redis_service_1.default.get(room, async (error, result) => {
            let data;
            if (result) {
                data = JSON.parse(result);
                if (!result.hasOwnProperty(socket.user._id)) {
                    data = {
                        ...data,
                        [socket.user._id]: {
                            firstName: socket.user.firstName,
                            lastName: socket.user.lastName
                        }
                    };
                    redis_service_1.default.setex(room, 60 * 60 * 24, JSON.stringify(data));
                }
            }
            else {
                data = {
                    [socket.user._id]: {
                        firstName: socket.user.firstName,
                        lastName: socket.user.lastName
                    }
                };
                redis_service_1.default.setex(room, 60 * 60 * 24, JSON.stringify(data));
            }
            // logger.info(`socket.join.${room}: {user: ${JSON.stringify((socket as any).user)}}`);
            socket.join(room);
            exports.io.to(room).emit('USERS_IN_CHANNEL', data);
        });
    });
    socket.on('leave', (data) => {
        const { room } = data;
        redis_service_1.default.get(room, async (error, result) => {
            let data;
            if (result) {
                data = JSON.parse(result);
                const key = socket.user._id;
                if (data.hasOwnProperty(key)) {
                    delete data[key];
                    redis_service_1.default.setex(room, 60 * 60 * 24, JSON.stringify(data));
                }
            }
            exports.io.to(room).emit('USERS_IN_CHANNEL', data);
            // logger.info(`socket.leave.${room}: {user: ${JSON.stringify((socket as any).user)}}`);
            socket.leave(room);
        });
    });
    socket.on('disconnect', () => {
        // logger.info(`socket.disconnect: {user: ${JSON.stringify((socket as any).user)}}`);
        // io.emit('user disconnected');
    });
});
exports.default = server;
//# sourceMappingURL=server.js.map