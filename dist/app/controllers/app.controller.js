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
var GraphicsMagick = require("gm");
var isuuid = require("is-uuid");
var moment = require("moment");
var passport = require("passport");
var Raven = require("raven");
var uuid = require("uuid");
var app_1 = require("../../app");
var logger_service_1 = require("../../services/logger.service");
var redis_service_1 = require("../../services/redis.service");
var general_utils_1 = require("../../utils/general.utils");
var recoverFile_model_1 = require("../models/recoverFile.model");
var user_model_1 = require("../models/user.model");
var AppController = /** @class */ (function () {
    function AppController() {
        this.index = this.index.bind(this);
        this.healthCheck = this.healthCheck.bind(this);
        this.robots = this.robots.bind(this);
        this.login = this.login.bind(this);
        this.processLogin = this.processLogin.bind(this);
        this.forgotPassword = this.forgotPassword.bind(this);
        this.processForgotPassword = this.processForgotPassword.bind(this);
        this.recovery = this.recovery.bind(this);
        this.processRecovery = this.processRecovery.bind(this);
        this.logout = this.logout.bind(this);
        this.recoverFile = this.recoverFile.bind(this);
    }
    /* istanbul ignore next */
    AppController.prototype.index = function (req, res) {
        res.render('app/index');
    };
    AppController.prototype.healthCheck = function (req, res) {
        res.json({ status: 'success' });
    };
    AppController.prototype.robots = function (req, res) {
        res.setHeader('content-type', 'text/plain; charset=utf-8');
        res.send("User-Agent: *\nDisallow: /");
    };
    AppController.prototype.login = function (req, res) {
        var next = req.query.next;
        if (req.user) {
            return res.redirect(next !== null && next !== void 0 ? next : '/');
        }
        else {
            return res.render('app/login', { next: next });
        }
    };
    AppController.prototype.processLogin = function (req, res, next) {
        var _this = this;
        /* istanbul ignore if */
        var nextPage = req.query.next;
        console.log('nextPage', nextPage);
        if (req.user) {
            return res.redirect(nextPage !== null && nextPage !== void 0 ? nextPage : '/');
        }
        else {
            var username_1 = req.body.username;
            passport.authenticate('local', function (err, user) {
                /* istanbul ignore if */
                if (err) {
                    return next(err); // will generate a 500 error
                }
                /* istanbul ignore if */
                if (!user) {
                    return res.render('app/login', {
                        username: username_1,
                        error: 'Usuario o contraseña incorrecta.',
                        next: nextPage
                    });
                }
                req.login(user, function (loginErr) {
                    /* istanbul ignore if */
                    if (loginErr) {
                        return next(loginErr);
                    }
                    else {
                        user.lastLogin = new Date();
                        user.save(function (err) { return __awaiter(_this, void 0, void 0, function () {
                            var e_1;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        if (!err) return [3 /*break*/, 1];
                                        console.log(err); // handle errors!
                                        return [3 /*break*/, 4];
                                    case 1:
                                        _a.trys.push([1, 3, , 4]);
                                        return [4 /*yield*/, user_model_1["default"].findById(user._id).populate({
                                                path: 'userPermissions',
                                                select: ['codeName']
                                            })];
                                    case 2:
                                        user = _a.sent();
                                        return [2 /*return*/, res.redirect(nextPage ? nextPage : user.hasPermission('viewInventory') ? '/inventory/' : '/')];
                                    case 3:
                                        e_1 = _a.sent();
                                        console.log(err); // handle errors!
                                        return [3 /*break*/, 4];
                                    case 4: return [2 /*return*/];
                                }
                            });
                        }); });
                    }
                });
            })(req, res, next);
        }
    };
    AppController.prototype.forgotPassword = function (req, res) {
        /* istanbul ignore if */
        if (req.user) {
            return res.redirect('/');
        }
        else {
            return res.render('app/forgotPassword', { csrfToken: req.csrfToken() });
        }
    };
    AppController.prototype.processForgotPassword = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, username, _csrf, csrfUsed, user, token, fullname, e_2;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = req.body, username = _a.username, _csrf = _a._csrf;
                        /* istanbul ignore if */
                        if (req.user) {
                            return [2 /*return*/, res.redirect('/')];
                        }
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, redis_service_1["default"].getAsync(_csrf)];
                    case 2:
                        csrfUsed = _b.sent();
                        /* istanbul ignore next */
                        if (csrfUsed) {
                            return [2 /*return*/, res.redirect('/account/forgot-password/')];
                        }
                        redis_service_1["default"].set(_csrf, 'forgot-password', 'ex', 60 * 10);
                        return [4 /*yield*/, user_model_1["default"].findOne({ email: username })];
                    case 3:
                        user = _b.sent();
                        if (user) {
                            token = uuid.v4();
                            fullname = user.fullName();
                            app_1.queue.create('email', {
                                from: '',
                                title: "Recovery password for ".concat(fullname),
                                to: "\"".concat(fullname, "\"<").concat(user.email, ">"),
                                subject: "Recuperaci\u00F3n de tu cuenta en OSA Andes",
                                text: "Hola ".concat(fullname, "\n\n            Recibimos una solicitud para restablecer tu contrase\u00F1a.\n\n            Haz clic aqu\u00ED para cambiar tu contrase\u00F1a.\n            ").concat(process.env.SITE_URL, "account/recovery/").concat(token, "/\n\n            \u00BFNo solicitaste este cambio?\n            Puedes contactarte con nosotros a trav\u00E9s de soporte@osacontrol.com.\n\n            \u00A9 2021 OSA SpA. Todos los derechos reservados."),
                                view: 'account/forgotPassword',
                                context: {
                                    fullname: fullname,
                                    url: "".concat(process.env.SITE_URL, "account/recovery/").concat(token, "/")
                                }
                            }).priority('high').attempts(5).save();
                            user.passwordResetToken = token;
                            user.passwordResetExpires = moment().add(2, 'days').toDate();
                            user.save();
                        }
                        return [3 /*break*/, 5];
                    case 4:
                        e_2 = _b.sent();
                        /* istanbul ignore next */
                        console.log(e_2);
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/, res.render('app/forgotPassword', {
                            csrfToken: req.csrfToken(),
                            post: username && username.length
                        })];
                }
            });
        });
    };
    AppController.prototype.recovery = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var token, user, e_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        token = req.params.token;
                        /* istanbul ignore next */
                        if (!isuuid.anyNonNil(token)) {
                            return [2 /*return*/, res.status(404).render('404')];
                        }
                        // close sesión
                        req.logout();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, user_model_1["default"]
                                .findOne({
                                passwordResetToken: token
                            })];
                    case 2:
                        user = _a.sent();
                        return [2 /*return*/, res.render('app/recovery', {
                                csrfToken: req.csrfToken(),
                                user: user
                            })];
                    case 3:
                        e_3 = _a.sent();
                        /* istanbul ignore next */
                        console.log(e_3);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    AppController.prototype.processRecovery = function (req, res, next) {
        return __awaiter(this, void 0, void 0, function () {
            var token, _a, password, password2, user_1, e_4;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        token = req.params.token;
                        _a = req.body, password = _a.password, password2 = _a.password2;
                        /* istanbul ignore next */
                        if (!isuuid.anyNonNil(token)) {
                            return [2 /*return*/, res.status(404).render('404')];
                        }
                        if (req.user) {
                            return [2 /*return*/, res.redirect("/")];
                        }
                        /* istanbul ignore next */
                        if (!password.trim().length || !password2.trim().length || password !== password2) {
                            return [2 /*return*/, res.redirect("/account/recovery/".concat(token))];
                        }
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 6, , 7]);
                        return [4 /*yield*/, user_model_1["default"].findOne({ passwordResetToken: token })];
                    case 2:
                        user_1 = _b.sent();
                        if (!(user_1 && user_1.active)) return [3 /*break*/, 4];
                        user_1.password = password;
                        user_1.passwordResetToken = undefined;
                        user_1.passwordResetExpires = undefined;
                        return [4 /*yield*/, user_1.save()];
                    case 3:
                        _b.sent();
                        req.login(user_1, function (loginErr) {
                            if (loginErr) {
                                return next(loginErr);
                            }
                            else {
                                user_1.lastLogin = new Date();
                                user_1.save(function (err) {
                                    if (err) {
                                        console.log(err); // handle errors!
                                    }
                                    else {
                                        return res.redirect('/');
                                    }
                                });
                            }
                        });
                        return [3 /*break*/, 5];
                    case 4: return [2 /*return*/, res.redirect("/account/recovery/".concat(token))];
                    case 5: return [3 /*break*/, 7];
                    case 6:
                        e_4 = _b.sent();
                        /* istanbul ignore next */
                        console.log(e_4);
                        return [3 /*break*/, 7];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    AppController.prototype.logout = function (req, res) {
        req.logout();
        res.redirect('/account/login/');
    };
    AppController.prototype.recoverFile = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, company, team, file, recoverFile_1, e_5;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = req.user, company = _a.company, team = _a.team;
                        file = general_utils_1["default"].getFileFromRequest(req.files, 'file');
                        logger_service_1["default"].info("uploadFile");
                        logger_service_1["default"].info("{user: {_id: ".concat(req.user._id, ", email: ").concat(req.user.email, "}, file: ").concat(JSON.stringify(file), "}}"));
                        if (!file) return [3 /*break*/, 6];
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 4, , 5]);
                        recoverFile_1 = new recoverFile_model_1["default"]();
                        if (!new RegExp('\\bimage\\b').test(file.mimetype)) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.autoRotate(file.path)];
                    case 2:
                        _b.sent();
                        _b.label = 3;
                    case 3:
                        file.headers = {
                            'Content-Type': file.mimetype
                        };
                        recoverFile_1.user = req.user._id;
                        recoverFile_1.company = company._id;
                        recoverFile_1.team = team._id;
                        recoverFile_1.attach('file', file, function (error) { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        if (!error) return [3 /*break*/, 1];
                                        /* istanbul ignore next */
                                        res.status(400).json(error);
                                        return [3 /*break*/, 3];
                                    case 1: return [4 /*yield*/, recoverFile_1.save()];
                                    case 2:
                                        _a.sent();
                                        res.status(201).json({
                                            data: {
                                                _id: recoverFile_1._id,
                                                file: recoverFile_1.file
                                            },
                                            status: 201
                                        });
                                        _a.label = 3;
                                    case 3: return [2 /*return*/];
                                }
                            });
                        }); });
                        return [3 /*break*/, 5];
                    case 4:
                        e_5 = _b.sent();
                        Raven.captureException(e_5, { req: req });
                        /* istanbul ignore next */
                        console.log(e_5);
                        logger_service_1["default"].error("recover file error:");
                        /* istanbul ignore next */
                        logger_service_1["default"].error(e_5);
                        /* istanbul ignore next */
                        res.status(400).json(e_5);
                        return [3 /*break*/, 5];
                    case 5: return [3 /*break*/, 7];
                    case 6:
                        logger_service_1["default"].error("uploadFile: La imagen es obligatoria.");
                        res.status(400).json({
                            message: 'La imagen es obligatoria.',
                            status: 400
                        });
                        _b.label = 7;
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    AppController.prototype.autoRotate = function (path) {
        // doc http://aheckmann.github.io/gm/docs.html
        /**** REQUIRE: imagemagick and graphicsmagick *****
         brew install imagemagick
         brew install graphicsmagick
         * */
        return new Promise(function (resolve, reject) {
            GraphicsMagick(path)
                .autoOrient()
                .write(path, function (err) {
                if (err) {
                    /* istanbul ignore next */
                    reject(err);
                }
                else {
                    resolve({});
                }
            });
        });
    };
    return AppController;
}());
exports["default"] = new AppController();
//# sourceMappingURL=app.controller.js.map