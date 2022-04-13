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
var server_1 = require("../../server");
var logger_service_1 = require("../../services/logger.service");
var requestItemStatus_model_1 = require("../models/requestItemStatus.model");
var RequestItemStatusController = /** @class */ (function () {
    function RequestItemStatusController() {
        this.apiList = this.apiList.bind(this);
        this.apiCreate = this.apiCreate.bind(this);
        this.apiUpdate = this.apiUpdate.bind(this);
        this.apiDelete = this.apiDelete.bind(this);
    }
    RequestItemStatusController.prototype.apiCreate = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var team, object, reason, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        team = req.user.team;
                        object = req.body;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, new requestItemStatus_model_1["default"](__assign(__assign({}, object), { team: team })).save()];
                    case 2:
                        reason = _a.sent();
                        server_1.io.to("request-status-list-" + team._id).emit('REFRESH', {
                            update: true
                        });
                        res.status(200).json(__assign({}, reason));
                        return [3 /*break*/, 4];
                    case 3:
                        e_1 = _a.sent();
                        /* istanbul ignore next */
                        logger_service_1["default"].error("RequestItemStatusController.apiCreate: Async Error.");
                        /* istanbul ignore next */
                        logger_service_1["default"].error("{user: {_id: " + req.user._id + ", email: " + req.user.email + "}}");
                        res.status(500).json(e_1);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    RequestItemStatusController.prototype.apiUpdate = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var team, id, update, reason, e_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        team = req.user.team;
                        id = req.params.id;
                        update = req.body;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 5, , 6]);
                        if (!update["default"]) return [3 /*break*/, 3];
                        return [4 /*yield*/, requestItemStatus_model_1["default"].updateMany({ team: team }, { $set: { "default": false } })];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3: return [4 /*yield*/, requestItemStatus_model_1["default"].findOneAndUpdate({ _id: id, team: team }, { $set: __assign({}, update) })];
                    case 4:
                        reason = _a.sent();
                        server_1.io.to("request-status-list-" + team._id).emit('REFRESH', {
                            update: true
                        });
                        res.status(200).json(__assign({}, reason));
                        return [3 /*break*/, 6];
                    case 5:
                        e_2 = _a.sent();
                        /* istanbul ignore next */
                        logger_service_1["default"].error("RequestItemStatusController.apiUpdate: Async Error.");
                        /* istanbul ignore next */
                        logger_service_1["default"].error("{user: {_id: " + req.user._id + ", email: " + req.user.email + "}}");
                        res.status(500).json(e_2);
                        return [3 /*break*/, 6];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    RequestItemStatusController.prototype.apiDelete = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var team, id, reason, e_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        team = req.user.team;
                        id = req.params.id;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, requestItemStatus_model_1["default"].findOneAndDelete({ _id: id, team: team })];
                    case 2:
                        reason = _a.sent();
                        server_1.io.to("request-status-list-" + team._id).emit('REFRESH', {
                            update: true
                        });
                        res.status(200).json(__assign({}, reason));
                        return [3 /*break*/, 4];
                    case 3:
                        e_3 = _a.sent();
                        /* istanbul ignore next */
                        logger_service_1["default"].error("RequestItemStatusController.apiDelete: Async Error.");
                        /* istanbul ignore next */
                        logger_service_1["default"].error("{user: {_id: " + req.user._id + ", email: " + req.user.email + "}}");
                        res.status(500).json(e_3);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    RequestItemStatusController.prototype.apiList = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, page, pageSize, team, options, filter, requestItemStatus, min, max, e_4;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = req.query, page = _a.page, pageSize = _a.pageSize;
                        team = req.user.team._id;
                        options = {
                            sort: {
                                weigth: 1
                            },
                            page: parseInt(page ? page : '1', 10),
                            limit: parseInt(pageSize ? pageSize : '200', 10)
                        };
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 7, , 8]);
                        filter = { team: team };
                        return [4 /*yield*/, this.getRequetsItemStatus(filter, options)];
                    case 2:
                        requestItemStatus = _b.sent();
                        if (!(options.page && requestItemStatus.pages && requestItemStatus.pages < options.page)) return [3 /*break*/, 3];
                        res.status(400).json({
                            message: 'La página solicitada no existe.',
                            status: 400
                        });
                        return [3 /*break*/, 6];
                    case 3: return [4 /*yield*/, requestItemStatus_model_1["default"].findOne({ team: team }).sort('weigth')];
                    case 4:
                        min = _b.sent();
                        return [4 /*yield*/, requestItemStatus_model_1["default"].findOne({ team: team }).sort('-weigth')];
                    case 5:
                        max = _b.sent();
                        res.json({
                            count: requestItemStatus.total,
                            pages: requestItemStatus.pages,
                            min: min ? min.weigth : 0,
                            max: max ? max.weigth : 1,
                            hasPrevious: options.page && options.page > 1 && requestItemStatus.pages && requestItemStatus.pages >= options.page,
                            hasNext: options.page && requestItemStatus.pages && requestItemStatus.pages > options.page,
                            results: requestItemStatus.docs,
                            status: 200
                        });
                        _b.label = 6;
                    case 6: return [3 /*break*/, 8];
                    case 7:
                        e_4 = _b.sent();
                        logger_service_1["default"].error(e_4);
                        /* istanbul ignore next */
                        logger_service_1["default"].error("RequestItemStatusController.apiList: Async Error.");
                        /* istanbul ignore next */
                        logger_service_1["default"].error("{user: {_id: " + req.user._id + ", email: " + req.user.email + "}}");
                        res.status(500).json(e_4);
                        return [3 /*break*/, 8];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    RequestItemStatusController.prototype.getRequetsItemStatus = function (filter, options) {
        return new Promise(function (resolve, reject) {
            requestItemStatus_model_1["default"].paginate(filter, options, function (err, result) {
                if (err) {
                    return reject(err);
                }
                return resolve(result);
            });
        });
    };
    return RequestItemStatusController;
}());
exports["default"] = new RequestItemStatusController();
//# sourceMappingURL=requestItemStatus.controller.js.map