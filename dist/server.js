"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.io = void 0;
var bluebird = require("bluebird");
var jwt = require("jsonwebtoken");
var mongoose = require("mongoose");
var socketIO = require("socket.io");
var socketRedis = require("socket.io-redis");
var app_1 = require("./app");
var logger_service_1 = require("./services/logger.service");
var redis_service_1 = require("./services/redis.service");
// Mongoose setting
var MONGODB_URI = process.env.MONGODB_URI || '';
// Mongoose connect
mongoose.Promise = bluebird;
mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true }, function (err) {
    if (err) {
        /* istanbul ignore next */
        console.log('Unable to connect to the mongodb instance. Error: ', err);
        throw err;
    }
    /* istanbul ignore if */
    if (app_1["default"].get('env') !== 'testing') {
        console.log('Mongoose Successfully connected');
    }
});
mongoose.set('debug', app_1["default"].get('env') === 'development');
var NODE_APP_INSTANCE = parseInt(process.env.NODE_APP_INSTANCE, 10) || 0;
var server = app_1["default"].listen(parseInt(app_1["default"].get('port'), 10) + NODE_APP_INSTANCE, function () {
    /* istanbul ignore if */
    if (app_1["default"].get('env') !== 'testing') {
        console.log("".concat(logger_service_1["default"].colors.magenta, "------------------------").concat(logger_service_1["default"].colors.reset));
        console.log("".concat(logger_service_1["default"].colors.brighCyan, "OSA-ANDES ").concat(logger_service_1["default"].colors.white, "v2.1.3 ").concat(logger_service_1["default"].colors.red, "RELEASE ").concat(logger_service_1["default"].colors.brighGreen, "NODE ").concat(logger_service_1["default"].colors.white).concat(process.version).concat(logger_service_1["default"].colors.reset));
        console.log("".concat(logger_service_1["default"].colors.magenta, "------------------------").concat(logger_service_1["default"].colors.reset));
        console.log("process.env.ENV ".concat(process.env.ENV));
        console.log('is running at http://localhost:%s in %s mode', app_1["default"].get('port'), app_1["default"].get('env'));
        console.log("".concat(logger_service_1["default"].colors.brightBlack, "Press CTRL-C to stop").concat(logger_service_1["default"].colors.reset));
    }
});
exports.io = socketIO(server);
exports.io.adapter(socketRedis({
    pubClient: (0, redis_service_1.createRedisClient)(),
    subClient: (0, redis_service_1.createRedisClient)()
}));
/* istanbul ignore next */
exports.io.use(function (socket, next) { return __awaiter(void 0, void 0, void 0, function () {
    var token, msgErrorAuthentication, user, e_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                token = socket.handshake.query.token;
                msgErrorAuthentication = 'authentication error';
                if (!token) return [3 /*break*/, 5];
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, jwt.verify(token, process.env.SECRET_KEY || 'secretKey')];
            case 2:
                user = _a.sent();
                if (user) {
                    // socket: generate user room
                    socket.user = user;
                    socket.join(user._id);
                    return [2 /*return*/, next()];
                }
                else {
                    socket.disconnect();
                    return [2 /*return*/, next(new Error(msgErrorAuthentication))];
                }
                return [3 /*break*/, 4];
            case 3:
                e_1 = _a.sent();
                socket.disconnect();
                return [2 /*return*/, next(new Error(msgErrorAuthentication))];
            case 4: return [3 /*break*/, 6];
            case 5:
                socket.disconnect();
                return [2 /*return*/, next(new Error(msgErrorAuthentication))];
            case 6: return [2 /*return*/];
        }
    });
}); });
/* istanbul ignore next */
exports.io.on('connection', function (socket) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        // logger.info(`socket.connection: {user: ${JSON.stringify((socket as any).user)}}`);
        socket.on('join', function (data) {
            var room = data.room;
            redis_service_1["default"].get(room, function (error, result) { return __awaiter(void 0, void 0, void 0, function () {
                var data;
                var _a, _b;
                return __generator(this, function (_c) {
                    if (result) {
                        data = JSON.parse(result);
                        if (!result.hasOwnProperty(socket.user._id)) {
                            data = __assign(__assign({}, data), (_a = {}, _a[socket.user._id] = {
                                firstName: socket.user.firstName,
                                lastName: socket.user.lastName
                            }, _a));
                            redis_service_1["default"].set(room, JSON.stringify(data), 'ex', 60 * 60 * 24);
                        }
                    }
                    else {
                        data = (_b = {},
                            _b[socket.user._id] = {
                                firstName: socket.user.firstName,
                                lastName: socket.user.lastName
                            },
                            _b);
                        redis_service_1["default"].set(room, JSON.stringify(data), 'ex', 60 * 60 * 24);
                    }
                    // logger.info(`socket.join.${room}: {user: ${JSON.stringify((socket as any).user)}}`);
                    socket.join(room);
                    exports.io.to(room).emit('USERS_IN_CHANNEL', data);
                    return [2 /*return*/];
                });
            }); });
            return socket.id;
        });
        socket.on('leave', function (data) {
            var room = data.room;
            redis_service_1["default"].get(room, function (error, result) { return __awaiter(void 0, void 0, void 0, function () {
                var data, key;
                return __generator(this, function (_a) {
                    if (result) {
                        data = JSON.parse(result);
                        key = socket.user._id;
                        if (data.hasOwnProperty(key)) {
                            delete data[key];
                            redis_service_1["default"].set(room, JSON.stringify(data), 'ex', 60 * 60 * 24);
                        }
                    }
                    exports.io.to(room).emit('USERS_IN_CHANNEL', data);
                    // logger.info(`socket.leave.${room}: {user: ${JSON.stringify((socket as any).user)}}`);
                    socket.leave(room);
                    return [2 /*return*/];
                });
            }); });
        });
        socket.on('disconnect', function () {
            // logger.info(`socket.disconnect: {user: ${JSON.stringify((socket as any).user)}}`);
            // io.emit('user disconnected');
        });
        return [2 /*return*/];
    });
}); });
exports["default"] = server;
//# sourceMappingURL=server.js.map