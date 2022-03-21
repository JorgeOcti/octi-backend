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
var alert_model_1 = require("../../models/alert.model");
var user_model_1 = require("../../models/user.model");
var AdminAlertController = /** @class */ (function () {
    function AdminAlertController() {
        this.index = this.index.bind(this);
        this.apiListAlerts = this.apiListAlerts.bind(this);
        this.apiCreateAlert = this.apiCreateAlert.bind(this);
        this.apiDeleteAlert = this.apiDeleteAlert.bind(this);
    }
    AdminAlertController.prototype.index = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, _b, _c;
            var _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        _b = (_a = res).render;
                        _c = ['app/index'];
                        _d = {};
                        return [4 /*yield*/, req.user.generateToken()];
                    case 1:
                        _b.apply(_a, _c.concat([(_d.token = _e.sent(), _d)]));
                        return [2 /*return*/];
                }
            });
        });
    };
    AdminAlertController.prototype.apiListAlerts = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var team, alerts, users, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        team = req.user.team._id;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, alert_model_1["default"]
                                .find({
                                team: team
                            }, {
                                name: 1,
                                users: 1,
                                lte: 1,
                                gte: 1
                            })
                                .populate([{
                                    path: 'users',
                                    select: ['firstName', 'lastName', 'email']
                                }])
                                .sort({
                                createdAt: -1
                            })];
                    case 2:
                        alerts = _a.sent();
                        return [4 /*yield*/, user_model_1["default"]
                                .find({ team: team }, {
                                firstName: 1,
                                lastName: 1,
                                email: 1
                            })];
                    case 3:
                        users = _a.sent();
                        res.json({
                            alerts: alerts,
                            users: users
                        });
                        return [3 /*break*/, 5];
                    case 4:
                        e_1 = _a.sent();
                        /* istanbul ignore next */
                        res.status(400).json({
                            message: e_1,
                            status: 400
                        });
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    AdminAlertController.prototype.apiCreateAlert = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, name, gte, lte, users, company, team, alert, _b, _c, e_2;
            var _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        _a = req.body, name = _a.name, gte = _a.gte, lte = _a.lte, users = _a.users;
                        company = req.user.company;
                        team = req.user.team._id;
                        _e.label = 1;
                    case 1:
                        _e.trys.push([1, 6, , 7]);
                        if (!(name && users && users.length)) return [3 /*break*/, 4];
                        return [4 /*yield*/, new alert_model_1["default"]({
                                name: name,
                                gte: gte,
                                lte: lte,
                                users: users,
                                company: company,
                                team: team
                            }).save()];
                    case 2:
                        alert = _e.sent();
                        _c = (_b = res.status(201)).json;
                        _d = {
                            message: 'Alerta agregada satisfactoriamente'
                        };
                        return [4 /*yield*/, alert_model_1["default"]
                                .findOne({
                                _id: alert._id,
                                team: team
                            }, {
                                name: 1,
                                users: 1,
                                lte: 1,
                                gte: 1
                            })
                                .populate([{
                                    path: 'users',
                                    select: ['firstName', 'lastName', 'email']
                                }])];
                    case 3:
                        _c.apply(_b, [(_d.alert = _e.sent(),
                                _d)]);
                        return [3 /*break*/, 5];
                    case 4:
                        /* istanbul ignore next */
                        res.status(400).json({
                            message: 'No se a podido crear a alerta'
                        });
                        _e.label = 5;
                    case 5: return [3 /*break*/, 7];
                    case 6:
                        e_2 = _e.sent();
                        /* istanbul ignore next */
                        res.status(400).json({
                            message: e_2,
                            status: 400
                        });
                        return [3 /*break*/, 7];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    AdminAlertController.prototype.apiDeleteAlert = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var id, team, alert, response, response, e_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        id = req.params.id;
                        team = req.user.team._id;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, alert_model_1["default"].findOneAndRemove({ _id: id, team: team })];
                    case 2:
                        alert = _a.sent();
                        if (alert) {
                            response = {
                                message: 'Alerta eliminada satisfactoriamente.',
                                id: alert._id
                            };
                            res.status(200).json(response);
                        }
                        else {
                            response = {
                                id: id,
                                message: 'Esta alerta ya fue eliminada.'
                            };
                            res.status(200).json(response);
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        e_3 = _a.sent();
                        /* istanbul ignore next */
                        res.status(500).json(e_3);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    return AdminAlertController;
}());
exports["default"] = new AdminAlertController();
//# sourceMappingURL=alert.admin.controller.js.map