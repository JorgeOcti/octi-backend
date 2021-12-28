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
var logger_service_1 = require("../../services/logger.service");
var server_1 = require("../../server");
var reason_model_1 = require("../models/reason.model");
var ReasonController = /** @class */ (function () {
    function ReasonController() {
        this.apiList = this.apiList.bind(this);
        this.apiCreate = this.apiCreate.bind(this);
        this.apiUpdate = this.apiUpdate.bind(this);
        this.apiDelete = this.apiDelete.bind(this);
    }
    ReasonController.prototype.apiList = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var team, _a, page, pageSize, options, reasons, e_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        logger_service_1["default"].info("ReasonController.apiList");
                        logger_service_1["default"].info("{user: {_id: ".concat(req.user._id, ", email: ").concat(req.user.email, "}}"));
                        team = req.user.team._id;
                        _a = req.query, page = _a.page, pageSize = _a.pageSize;
                        options = {
                            sort: {
                                name: 1
                            },
                            select: {
                                name: true,
                                file: true,
                                questions: true,
                                updatedAt: true,
                                createdAt: true
                            },
                            page: parseInt(page ? page : '1', 10),
                            limit: parseInt(pageSize ? pageSize : '20', 10)
                        };
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.getReasons({ team: team }, options)];
                    case 2:
                        reasons = _b.sent();
                        /* istanbul ignore if  */
                        if (options.page && reasons.pages && reasons.pages < options.page) {
                            res.status(400).json({
                                message: 'La página solicitada no existe.',
                                status: 400
                            });
                        }
                        else {
                            res.json({
                                count: reasons.total,
                                pages: reasons.pages,
                                hasPrevious: options.page && options.page > 1 && reasons.pages && reasons.pages >= options.page,
                                hasNext: options.page && reasons.pages && reasons.pages > options.page,
                                results: reasons.docs,
                                status: 200
                            });
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        e_1 = _b.sent();
                        /* istanbul ignore next */
                        logger_service_1["default"].error("ReasonController.apiList: Async Error.");
                        /* istanbul ignore next */
                        logger_service_1["default"].error("{user: {_id: ".concat(req.user._id, ", email: ").concat(req.user.email, "}}"));
                        res.status(500).json(e_1);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    ReasonController.prototype.apiCreate = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var team, object, reason, e_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        team = req.user.team;
                        object = req.body;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, new reason_model_1["default"](__assign(__assign({}, object), { team: team })).save()];
                    case 2:
                        reason = _a.sent();
                        server_1.io.to("reasons-list-".concat(team._id)).emit('REFRESH', {
                            update: true
                        });
                        res.status(200).json(__assign({}, reason));
                        return [3 /*break*/, 4];
                    case 3:
                        e_2 = _a.sent();
                        /* istanbul ignore next */
                        logger_service_1["default"].error("ReasonController.apiCreate: Async Error.");
                        /* istanbul ignore next */
                        logger_service_1["default"].error("{user: {_id: ".concat(req.user._id, ", email: ").concat(req.user.email, "}}"));
                        res.status(500).json(e_2);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    ReasonController.prototype.apiUpdate = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var team, id, update, reason, e_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        team = req.user.team;
                        id = req.params.id;
                        update = req.body;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, reason_model_1["default"].findOneAndUpdate({ _id: id }, { $set: __assign({}, update) })];
                    case 2:
                        reason = _a.sent();
                        server_1.io.to("reasons-list-".concat(team._id)).emit('REFRESH', {
                            update: true
                        });
                        res.status(200).json(__assign({}, reason));
                        return [3 /*break*/, 4];
                    case 3:
                        e_3 = _a.sent();
                        /* istanbul ignore next */
                        logger_service_1["default"].error("ReasonController.apiUpdate: Async Error.");
                        /* istanbul ignore next */
                        logger_service_1["default"].error("{user: {_id: ".concat(req.user._id, ", email: ").concat(req.user.email, "}}"));
                        res.status(500).json(e_3);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    ReasonController.prototype.apiDelete = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var team, id, reason, e_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        team = req.user.team;
                        id = req.params.id;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, reason_model_1["default"].findOneAndDelete({ _id: id, team: team })];
                    case 2:
                        reason = _a.sent();
                        server_1.io.to("reasons-list-".concat(team._id)).emit('REFRESH', {
                            update: true
                        });
                        res.status(200).json(__assign({}, reason));
                        return [3 /*break*/, 4];
                    case 3:
                        e_4 = _a.sent();
                        /* istanbul ignore next */
                        logger_service_1["default"].error("ReasonController.apiDelete: Async Error.");
                        /* istanbul ignore next */
                        logger_service_1["default"].error("{user: {_id: ".concat(req.user._id, ", email: ").concat(req.user.email, "}}"));
                        res.status(500).json(e_4);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    ReasonController.prototype.getReasons = function (filter, options) {
        return new Promise(function (resolve, reject) {
            reason_model_1["default"].paginate(filter, options, function (err, result) {
                if (err) {
                    return reject(err);
                }
                return resolve(result);
            });
        });
    };
    return ReasonController;
}());
exports["default"] = new ReasonController();
//# sourceMappingURL=reason.controller.js.map