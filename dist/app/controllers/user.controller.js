"use strict";
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
var bcrypt = require("bcrypt");
var logger_service_1 = require("../../services/logger.service");
var user_model_1 = require("../models/user.model");
var user_model_2 = require("../models/user.model");
var venue_model_1 = require("../models/venue.model");
var push_service_1 = require("../../services/push.service");
var permission_model_1 = require("../models/permission.model");
var UserController = /** @class */ (function () {
    function UserController() {
        this.apiChangePassword = this.apiChangePassword.bind(this);
        this.apiListVenues = this.apiListVenues.bind(this);
        this.apiListDrivers = this.apiListDrivers.bind(this);
        this.getUsers = this.getUsers.bind(this);
        this.getStatsAccessUser = this.getStatsAccessUser.bind(this);
        this.apiChangeVenue = this.apiChangeVenue.bind(this);
    }
    UserController.prototype.apiListDrivers = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var team, _a, page, pageSize, options, filter, drivers, e_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        logger_service_1["default"].info("UserController.apiListDrivers");
                        logger_service_1["default"].info("{user: {_id: " + req.user._id + ", email: " + req.user.email + "}}");
                        team = req.user.team._id;
                        _a = req.query, page = _a.page, pageSize = _a.pageSize;
                        options = {
                            sort: {
                                firstName: 1
                            },
                            select: {
                                firstName: true,
                                lastName: true,
                                email: true,
                                venue: true
                            },
                            populate: [{
                                    path: 'company',
                                    select: ['name']
                                }, {
                                    path: 'venue',
                                    select: ['name']
                                }],
                            page: parseInt(page ? page : '1', 10),
                            limit: parseInt(pageSize ? pageSize : '200', 10)
                        };
                        filter = {
                            team: team,
                            isDriver: true
                        };
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.getUsers(filter, options)];
                    case 2:
                        drivers = _b.sent();
                        /* istanbul ignore if  */
                        if (options.page && drivers.pages && drivers.pages < options.page) {
                            res.status(400).json({
                                message: 'La página solicitada no existe.',
                                status: 400
                            });
                        }
                        else {
                            res.json({
                                count: drivers.total,
                                pages: drivers.pages,
                                hasPrevious: options.page && options.page > 1 && drivers.pages && drivers.pages >= options.page,
                                hasNext: options.page && drivers.pages && drivers.pages > options.page,
                                results: drivers.docs,
                                status: 200
                            });
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        e_1 = _b.sent();
                        /* istanbul ignore next */
                        logger_service_1["default"].error("UserController.apiListDrivers: Async Error.");
                        /* istanbul ignore next */
                        logger_service_1["default"].error("{user: {_id: " + req.user._id + ", email: " + req.user.email + "}}");
                        res.status(500).json(e_1);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    UserController.prototype.apiChangePassword = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var user, _a, password, newPassword, User_1, isPassword, e_2;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        user = req.user;
                        _a = req.body, password = _a.password, newPassword = _a.newPassword;
                        if (!(password && password.trim().length && newPassword && newPassword.trim().length)) return [3 /*break*/, 5];
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, user_model_1["default"].findById(user._id)];
                    case 2:
                        User_1 = _b.sent();
                        if (User_1) {
                            isPassword = bcrypt.compareSync(password, User_1.password);
                            if (isPassword) {
                                User_1.password = newPassword;
                                User_1.save();
                                res.status(200).json({
                                    message: 'Contraseña cambiada satisfactoriamente.',
                                    status: 200
                                });
                            }
                            else {
                                res.status(400).json({
                                    message: 'El password actual no corresponde',
                                    status: 400
                                });
                            }
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        e_2 = _b.sent();
                        /* istanbul ignore next */
                        res.status(400).json({
                            message: 'Ha ocurrido un error',
                            status: 400
                        });
                        return [3 /*break*/, 4];
                    case 4: return [3 /*break*/, 6];
                    case 5:
                        /* istanbul ignore next */
                        res.status(400).json({
                            message: 'No se ha podido cambiar la contraseña',
                            status: 400
                        });
                        _b.label = 6;
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    UserController.prototype.apiListVenues = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var team, currentUser, _a, _b, e_3;
            var _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        team = req.user.team._id;
                        logger_service_1["default"].info("apiListVenues");
                        logger_service_1["default"].info("{user: {_id: " + req.user._id + ", email: " + req.user.email + "}}");
                        _d.label = 1;
                    case 1:
                        _d.trys.push([1, 6, , 7]);
                        return [4 /*yield*/, user_model_1["default"].findById(req.user._id)];
                    case 2:
                        currentUser = _d.sent();
                        if (!currentUser) return [3 /*break*/, 4];
                        _b = (_a = res.status(200)).json;
                        _c = {};
                        return [4 /*yield*/, venue_model_1["default"].find({
                                _id: {
                                    $in: currentUser.venuesPermissions()
                                },
                                team: team
                            }, {
                                name: true,
                                lat: true,
                                lng: true
                            })];
                    case 3:
                        _b.apply(_a, [(_c.venues = _d.sent(),
                                _c.status = 200,
                                _c)]);
                        return [3 /*break*/, 5];
                    case 4:
                        /* istanbul ignore next */
                        res.status(400).json({
                            message: 'Ha ocurrido un error',
                            status: 400
                        });
                        _d.label = 5;
                    case 5: return [3 /*break*/, 7];
                    case 6:
                        e_3 = _d.sent();
                        logger_service_1["default"].error("apiListVenues: Async Error.");
                        logger_service_1["default"].error(e_3);
                        /* istanbul ignore next */
                        res.status(500).json({
                            message: 'Ha ocurrido un error',
                            status: 500
                        });
                        return [3 /*break*/, 7];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    UserController.prototype.apiChangeVenue = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var team, venue, currentUser, currentVenue, e_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        team = req.user.team._id;
                        venue = req.body.venue;
                        logger_service_1["default"].info("apiChangeVenue");
                        logger_service_1["default"].info("{user: {_id: " + req.user._id + ", email: " + req.user.email + "}, body: " + JSON.stringify(req.body) + "}");
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 7, , 8]);
                        return [4 /*yield*/, user_model_1["default"].findById(req.user._id)];
                    case 2:
                        currentUser = _a.sent();
                        return [4 /*yield*/, venue_model_1["default"].findOne({ _id: venue, team: team })];
                    case 3:
                        currentVenue = _a.sent();
                        if (!(currentUser && currentVenue && currentUser.venuesPermissions(true).includes(venue))) return [3 /*break*/, 5];
                        currentUser.venue = currentVenue;
                        currentUser.company = currentVenue.company;
                        return [4 /*yield*/, currentUser.save()];
                    case 4:
                        _a.sent();
                        res.status(200).json({
                            message: 'Usuario editado satisfactoriamente.',
                            status: 200
                        });
                        return [3 /*break*/, 6];
                    case 5:
                        /* istanbul ignore next */
                        logger_service_1["default"].error("apiChangeVenue: Ha ocurrido un error.");
                        res.status(400).json({
                            message: 'Operación no permitida',
                            status: 400
                        });
                        _a.label = 6;
                    case 6: return [3 /*break*/, 8];
                    case 7:
                        e_4 = _a.sent();
                        logger_service_1["default"].error("apiChangeVenue: Async Error.");
                        logger_service_1["default"].error(e_4);
                        /* istanbul ignore next */
                        res.status(500).json({
                            message: 'Ha ocurrido un error',
                            status: 500
                        });
                        return [3 /*break*/, 8];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    UserController.prototype.getUsers = function (filter, options) {
        return new Promise(function (resolve, reject) {
            user_model_2["default"].paginate(filter, options, function (err, result) {
                /* istanbul ignore next  */
                if (err) {
                    return reject(err);
                }
                return resolve(result);
            });
        });
    };
    UserController.prototype.getStatsAccessUser = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var team, permissions, options, filter, users, e_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        logger_service_1["default"].info("UserController.apiListStatsUser");
                        logger_service_1["default"].info("{user: {_id: " + req.user._id + ", email: " + req.user.email + "}}");
                        team = req.user.team._id;
                        return [4 /*yield*/, permission_model_1["default"].find({
                                codeName: { $in: ['viewInventoryStudio', 'viewDistributionStudio', 'viewChecklistStudio'] }
                            })];
                    case 1:
                        permissions = _a.sent();
                        logger_service_1["default"].info(JSON.stringify(permissions));
                        options = {
                            sort: {
                                firstName: 1
                            },
                            select: {
                                firstName: true,
                                lastName: true
                            }
                        };
                        filter = {
                            team: team,
                            userPermissions: { $in: permissions.map(function (p) { return p._id; }) }
                        };
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, this.getUsers(filter, options)];
                    case 3:
                        users = _a.sent();
                        /* istanbul ignore if  */
                        res.json({
                            results: users.docs,
                            status: 200
                        });
                        return [3 /*break*/, 5];
                    case 4:
                        e_5 = _a.sent();
                        /* istanbul ignore next */
                        logger_service_1["default"].error("UserController.apiListDrivers: Async Error.");
                        /* istanbul ignore next */
                        logger_service_1["default"].error("{user: {_id: " + req.user._id + ", email: " + req.user.email + "}}");
                        res.status(500).json(e_5);
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    UserController.prototype.getPusherToken = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (req.user._id === req.query['user_id'])
                    res.status(200).json(push_service_1["default"].createAuthToken(req.user._id));
                else
                    res.status(401).json({ message: 'Authentication failed. User provided does not match with user_id.' });
                return [2 /*return*/];
            });
        });
    };
    return UserController;
}());
exports["default"] = new UserController();
//# sourceMappingURL=user.controller.js.map