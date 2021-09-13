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
var jwt = require("jsonwebtoken");
var moment = require("moment-timezone");
var uuid = require("uuid");
var app_1 = require("../../app");
var participant_model_1 = require("../../form/models/participant.model");
var logger_service_1 = require("../../services/logger.service");
var general_utils_1 = require("../../utils/general.utils");
var user_model_1 = require("../models/user.model");
var user_model_2 = require("../models/user.model");
var version_model_1 = require("../models/version.model");
var teamSetting_model_1 = require("../models/teamSetting.model");
var JWTController = /** @class */ (function () {
    function JWTController() {
        this.androidVersion = '2.4.2';
        this.iosVersion = '1.4.0';
        this.login = this.login.bind(this);
        this.token = this.token.bind(this);
        // this.isJWTAuthenticated = this.isJWTAuthenticated.bind(this);
        this.forgotPassword = this.forgotPassword.bind(this);
    }
    JWTController.prototype.login = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var version_1;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        logger_service_1["default"].info("login: {username: " + req.body.username);
                        if (!(req.body.username === null || req.body.username === undefined || req.body.password === null || req.body.password === undefined)) return [3 /*break*/, 1];
                        logger_service_1["default"].error("login: Authentication failed. Invalid user or password.");
                        res.status(401).json({ message: 'Authentication failed. Invalid user or password.' });
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, version_model_1["default"].findOne({}, ['ios', 'android'], {
                            sort: {
                                createdAt: -1
                            }
                        })];
                    case 2:
                        version_1 = _a.sent();
                        user_model_1["default"]
                            .findOne({
                            email: req.body.username
                        }, {
                            firstName: true,
                            lastName: true,
                            email: true,
                            password: true,
                            updatedAt: true,
                            preferred: true,
                            venue: true,
                            team: true,
                            company: true,
                            userForms: true,
                            userPermissions: true,
                            active: true,
                            isDriver: true
                        })
                            .populate([{
                                path: 'venue',
                                select: ['name', 'lat', 'lng']
                            }, {
                                path: 'team',
                                select: ['name']
                            }, {
                                path: 'company',
                                select: ['name']
                            }, {
                                path: 'userPermissions',
                                select: ['codeName']
                            }, {
                                path: 'userForms',
                                select: ['name']
                            }])
                            .exec(function (err, user) {
                            if (err) {
                                /* istanbul ignore next */
                                res.status(500).send(err);
                            }
                            if (!user || !user.comparePasswordSync(req.body.password)) {
                                logger_service_1["default"].error("login: Authentication failed. Invalid user or password.");
                                res.status(401).json({
                                    message: 'Authentication failed. Invalid user or password.',
                                    status: 401
                                });
                            }
                            else if (!user.active) {
                                logger_service_1["default"].error("login: User is inactive");
                                res.status(401).json({
                                    message: 'User is inactive',
                                    status: 401
                                });
                            }
                            else {
                                user.lastLogin = new Date();
                                user.save(function (err) {
                                    if (err) {
                                        /* istanbul ignore next */
                                        res.status(500).json(err);
                                    }
                                    else {
                                        var today = moment().startOf('day');
                                        var tomorrow = moment(today).add(1, 'days');
                                        participant_model_1["default"].count({
                                            user: user,
                                            createdAt: {
                                                $gte: today.toDate(),
                                                $lt: tomorrow.toDate()
                                            }
                                        }, function (err, count) { return __awaiter(_this, void 0, void 0, function () {
                                            var teamSettings, userInfo;
                                            return __generator(this, function (_a) {
                                                switch (_a.label) {
                                                    case 0:
                                                        user = user.toObject();
                                                        return [4 /*yield*/, teamSetting_model_1["default"].findOne({ team: user.team })];
                                                    case 1:
                                                        teamSettings = _a.sent();
                                                        userInfo = {
                                                            _id: user._id,
                                                            firstName: user.firstName,
                                                            lastName: user.lastName,
                                                            email: user.email,
                                                            preferred: user.preferred,
                                                            userPermissions: user.userPermissions,
                                                            userForms: user.userForms,
                                                            isDriver: user.isDriver || false,
                                                            venue: {
                                                                _id: general_utils_1["default"].getObjectProperty(user.venue, '_id', null),
                                                                name: general_utils_1["default"].getObjectProperty(user.venue, 'name', null),
                                                                lat: general_utils_1["default"].getObjectProperty(user.venue, 'lat', 0),
                                                                lng: general_utils_1["default"].getObjectProperty(user.venue, 'lng', 0)
                                                            },
                                                            company: {
                                                                _id: general_utils_1["default"].getObjectProperty(user.company, '_id', null),
                                                                name: general_utils_1["default"].getObjectProperty(user.company, 'name', null)
                                                            },
                                                            team: {
                                                                _id: general_utils_1["default"].getObjectProperty(user.team, '_id', null),
                                                                name: general_utils_1["default"].getObjectProperty(user.team, 'name', null),
                                                                settings: {
                                                                    form: general_utils_1["default"].getObjectProperty(teamSettings, 'form', {
                                                                        vinMinCharacters: 17,
                                                                        vinMaxCharacters: 17
                                                                    })
                                                                }
                                                                // settings: GeneralUtils.getObjectProperty(user.team, 'settings', {})
                                                            },
                                                            count: count
                                                        };
                                                        res.json({
                                                            data: {
                                                                token: jwt.sign(userInfo, req.app.locals.secretKey, {
                                                                    expiresIn: '7 days'
                                                                }),
                                                                // token: jwt.sign(userInfo, req.app.locals.secretKey, {
                                                                //   expiresIn: '60 seconds'
                                                                // }),
                                                                refreshToken: jwt.sign(userInfo, req.app.locals.secretKey, {
                                                                    expiresIn: '30 days'
                                                                }),
                                                                iosVersion: version_1.ios,
                                                                androidVersion: version_1.android,
                                                                user: userInfo
                                                            },
                                                            status: 200
                                                        });
                                                        return [2 /*return*/];
                                                }
                                            });
                                        }); });
                                    }
                                });
                            }
                        });
                        _a.label = 3;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    JWTController.prototype.token = function (req, res) {
        var _this = this;
        var refreshToken = req.body.refreshToken;
        if (!refreshToken) {
            logger_service_1["default"].error("token: refresh token is required");
            logger_service_1["default"].error("{body: " + req.body + ", headers: " + JSON.stringify(req.headers) + "}");
            res.status(400).json({
                message: 'refresh token is required',
                status: 400
            });
        }
        else {
            jwt.verify(refreshToken, req.app.locals.secretKey, function (err, decode) {
                if (err) {
                    logger_service_1["default"].error("token: JWT error");
                    logger_service_1["default"].error("{body: " + req.body + ", headers: " + JSON.stringify(req.headers) + "}");
                    res.status(401).json({
                        message: err.message,
                        status: 401
                    });
                }
                else {
                    user_model_1["default"]
                        .findById(decode._id, {
                        firstName: true,
                        lastName: true,
                        email: true,
                        password: true,
                        updatedAt: true,
                        preferred: true,
                        venue: true,
                        company: true,
                        team: true,
                        userForms: true,
                        userPermissions: true,
                        active: true,
                        isDriver: true
                    })
                        .populate([{
                            path: 'venue',
                            select: ['name']
                        }, {
                            path: 'company',
                            select: ['name']
                        }, {
                            path: 'team',
                            select: ['name']
                        }, {
                            path: 'userPermissions',
                            select: ['codeName']
                        }, {
                            path: 'userForms',
                            select: ['name']
                        }])
                        .exec(function (err, user) {
                        if (err) {
                            /* istanbul ignore next */
                            res.status(500).json(err);
                        }
                        else if (!user) {
                            logger_service_1["default"].error("token: User not found");
                            res.status(401).json({
                                message: 'User not found',
                                status: 401
                            });
                        }
                        else if (!user.active) {
                            logger_service_1["default"].error("token: User is inactive");
                            res.status(401).json({
                                message: 'User is inactive',
                                status: 401
                            });
                        }
                        else {
                            user.lastLogin = new Date();
                            user.save(function (err) {
                                if (err) {
                                    logger_service_1["default"].error("token: Save user");
                                    /* istanbul ignore next */
                                    res.status(500).json(err);
                                }
                                else {
                                    var today = moment().startOf('day');
                                    var tomorrow = moment(today).add(1, 'days');
                                    participant_model_1["default"].count({
                                        user: user,
                                        createdAt: {
                                            $gte: today.toDate(),
                                            $lt: tomorrow.toDate()
                                        }
                                    }, function (err, count) { return __awaiter(_this, void 0, void 0, function () {
                                        var teamSettings, userInfo;
                                        return __generator(this, function (_a) {
                                            switch (_a.label) {
                                                case 0:
                                                    user = user.toObject();
                                                    return [4 /*yield*/, teamSetting_model_1["default"].findOne({ team: user.team })];
                                                case 1:
                                                    teamSettings = _a.sent();
                                                    userInfo = {
                                                        _id: user._id,
                                                        firstName: user.firstName,
                                                        lastName: user.lastName,
                                                        email: user.email,
                                                        preferred: user.preferred,
                                                        userPermissions: user.userPermissions,
                                                        userForms: user.userForms,
                                                        isDriver: user.isDriver || false,
                                                        venue: {
                                                            _id: general_utils_1["default"].getObjectProperty(user.venue, '_id', null),
                                                            name: general_utils_1["default"].getObjectProperty(user.venue, 'name', null)
                                                        },
                                                        company: {
                                                            _id: general_utils_1["default"].getObjectProperty(user.company, '_id', null),
                                                            name: general_utils_1["default"].getObjectProperty(user.company, 'name', null)
                                                        },
                                                        team: {
                                                            _id: general_utils_1["default"].getObjectProperty(user.team, '_id', null),
                                                            name: general_utils_1["default"].getObjectProperty(user.team, 'name', null),
                                                            settings: {
                                                                form: general_utils_1["default"].getObjectProperty(teamSettings, 'form', {
                                                                    vinMinCharacters: 17,
                                                                    vinMaxCharacters: 17
                                                                })
                                                            }
                                                            // settings: GeneralUtils.getObjectProperty(user.team, 'settings', {})
                                                        },
                                                        count: count
                                                    };
                                                    res.json({
                                                        data: {
                                                            token: jwt.sign(userInfo, req.app.locals.secretKey, {
                                                                expiresIn: '7 days'
                                                            }),
                                                            refreshToken: jwt.sign(userInfo, req.app.locals.secretKey, {
                                                                expiresIn: '30 days'
                                                            }),
                                                            iosVersion: this.iosVersion,
                                                            androidVersion: this.androidVersion,
                                                            user: userInfo
                                                        },
                                                        status: 200
                                                    });
                                                    return [2 /*return*/];
                                            }
                                        });
                                    }); });
                                }
                            });
                        }
                    });
                }
            });
        }
    };
    JWTController.prototype.forgotPassword = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var username, user, token, fullname, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        username = req.body.username;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 6, , 7]);
                        return [4 /*yield*/, user_model_2["default"].findOne({ email: username })];
                    case 2:
                        user = _a.sent();
                        if (!user) return [3 /*break*/, 4];
                        token = uuid.v4();
                        fullname = user.fullName();
                        app_1.queue.create('email', {
                            from: '',
                            title: "Recovery password for " + fullname,
                            to: "\"" + fullname + "\"<" + user.email + ">",
                            subject: "Recuperaci\u00F3n de tu cuenta en OSA Andes",
                            text: "Hola " + fullname + "\n\n            Recibimos una solicitud para restablecer tu contrase\u00F1a.\n\n            Haz clic aqu\u00ED para cambiar tu contrase\u00F1a.\n            " + process.env.SITE_URL + "account/recovery/" + token + "/\n\n            \u00BFNo solicitaste este cambio?\n            Puedes contactarte con nosotros a trav\u00E9s de soporte@osacontrol.com.\n\n            \u00A9 2021 OSA SpA. Todos los derechos reservados.",
                            view: 'account/forgotPassword',
                            context: {
                                fullname: fullname,
                                url: process.env.SITE_URL + "account/recovery/" + token + "/"
                            }
                        }).priority('high').attempts(5).save();
                        user.passwordResetToken = token;
                        user.passwordResetExpires = moment().add(2, 'days').toDate();
                        return [4 /*yield*/, user.save()];
                    case 3:
                        _a.sent();
                        /* istanbul ignore next */
                        if (app_1["default"].get('env') !== 'testing') {
                            console.log('Se ha reestablecido ', username);
                        }
                        res.json({
                            message: 'Se ha enviado un e-mail para reestablecer tú contraseña',
                            status: 200
                        });
                        return [3 /*break*/, 5];
                    case 4:
                        /* istanbul ignore next */
                        if (app_1["default"].get('env') !== 'testing') {
                            console.log('No se encontro ', username);
                        }
                        res.json({
                            message: 'Se ha enviado un e-mail para reestablecer tú contraseña',
                            status: 200
                        });
                        _a.label = 5;
                    case 5: return [3 /*break*/, 7];
                    case 6:
                        e_1 = _a.sent();
                        /* istanbul ignore next */
                        console.log(e_1);
                        /* istanbul ignore next */
                        console.log('ocurrio un error ', username);
                        /* istanbul ignore next */
                        res.json({
                            message: 'Se ha enviado un e-mail para reestablecer tú contraseña',
                            status: 200
                        });
                        return [3 /*break*/, 7];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /* istanbul ignore next */
    // public isJWTAuthenticated(req: IRequest, res: Response, next: NextFunction) {
    //   if (req.headers && req.headers.authorization && req.headers.authorization.split(' ')[0] === 'JWT') {
    //     jwt.verify(req.headers.authorization.split(' ')[1], req.app.locals.secretKey, (err: any, decode: any) => {
    //       if (err) {
    //         res.status(401).json({
    //           message: err.message,
    //           status: 401
    //         });
    //       }
    //       req.user = decode;
    //       next();
    //     });
    //   } else {
    //     res.status(403).json({
    //       message: 'Forbidden',
    //       status: 403
    //     });
    //     next();
    //   }
    // }
    /* istanbul ignore next */
    JWTController.prototype.test = function (req, res) {
        res.json({
            data: {
                user: req.user
            },
            status: 200
        });
    };
    return JWTController;
}());
exports["default"] = new JWTController();
//# sourceMappingURL=jwt.controller.js.map