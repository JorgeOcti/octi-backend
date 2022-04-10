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
var transmittalItem_model_1 = require("../models/transmittalItem.model");
var transmittal_controller_1 = require("./transmittal.controller");
var logger_service_1 = require("../../services/logger.service");
var server_1 = require("../../server");
var transmittal_model_1 = require("../models/transmittal.model");
var requestItem_model_1 = require("../../request/models/requestItem.model");
var car_model_1 = require("../../app/models/car.model");
var moment = require("../../../public/theme/bower_components/moment/moment");
var TransmittalItemController = /** @class */ (function () {
    function TransmittalItemController() {
        this.index = this.index.bind(this);
        this.apiList = this.apiList.bind(this);
        this.apiDetail = this.apiDetail.bind(this);
        this.apiCreate = this.apiCreate.bind(this);
        this.apiDelete = this.apiDelete.bind(this);
        this.apiUpdate = this.apiUpdate.bind(this);
    }
    TransmittalItemController.prototype.index = function (req, res) {
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
    TransmittalItemController.prototype.apiList = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                res.json({
                    api: 'TransmittalItemController:apiList'
                });
                return [2 /*return*/];
            });
        });
    };
    TransmittalItemController.prototype.apiDetail = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                res.json({
                    api: 'TransmittalItemController:apiDetail'
                });
                return [2 /*return*/];
            });
        });
    };
    TransmittalItemController.prototype.apiUpdate = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var id, transmittalItem, team, car, newTransmittalItem, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        logger_service_1["default"].info("TransmittalItemController.apiUpdate");
                        id = req.params.id;
                        transmittalItem = req.body;
                        team = req.user.team;
                        if (!transmittalItem.car) return [3 /*break*/, 2];
                        car = transmittalItem.car;
                        return [4 /*yield*/, car_model_1["default"].findOneAndUpdate({ _id: car._id, team: team }, { $set: car })];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [4 /*yield*/, transmittalItem_model_1["default"]
                            .findOneAndUpdate({ _id: id }, { $set: transmittalItem }, { "new": true })
                            .populate(transmittal_controller_1["default"].itemPopulate)];
                    case 3:
                        newTransmittalItem = _a.sent();
                        server_1.io.to("transmittal-list-".concat(team._id)).emit('UPDATE_TRANSMITTAL_ITEM', {
                            transmittalItem: newTransmittalItem
                        });
                        res.json({
                            data: newTransmittalItem
                        });
                        return [3 /*break*/, 5];
                    case 4:
                        e_1 = _a.sent();
                        /* istanbul ignore next */
                        logger_service_1["default"].error(e_1);
                        /* istanbul ignore next */
                        logger_service_1["default"].error("TransmittalItemController.apiUpdate: Async Error.");
                        /* istanbul ignore next */
                        logger_service_1["default"].error("{user: {_id: ".concat(req.user._id, ", email: ").concat(req.user.email, "}}"));
                        res.status(500).json(e_1);
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    TransmittalItemController.prototype.apiCreate = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var item, user, team, transmittalItem, transmittalItemData, e_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        item = req.body, user = req.user;
                        team = user.team;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 6, , 7]);
                        return [4 /*yield*/, new transmittalItem_model_1["default"](__assign(__assign({ team: team }, item), { loadingDate: moment().toDate() })).save()];
                    case 2:
                        transmittalItem = _a.sent();
                        return [4 /*yield*/, transmittalItem_model_1["default"]
                                .findById(transmittalItem._id)
                                .populate(transmittal_controller_1["default"].itemPopulate)];
                    case 3:
                        transmittalItemData = _a.sent();
                        if (!item.requestItem) return [3 /*break*/, 5];
                        return [4 /*yield*/, requestItem_model_1["default"].findOneAndUpdate({
                                _id: item.requestItem
                            }, {
                                assigned: true,
                                transmittal: item.transmittal,
                                transmittalItem: transmittalItem._id
                            })];
                    case 4:
                        _a.sent();
                        _a.label = 5;
                    case 5:
                        server_1.io.to("transmittal-list-".concat(team._id))
                            .emit('CREATE_TRANSMITTAL_ITEM', {
                            transmittalItem: transmittalItemData
                        });
                        res.json({
                            data: transmittalItemData
                        });
                        return [3 /*break*/, 7];
                    case 6:
                        e_2 = _a.sent();
                        /* istanbul ignore next */
                        logger_service_1["default"].error(e_2);
                        /* istanbul ignore next */
                        logger_service_1["default"].error("TransmittalItemController.apiCreate: Async Error.");
                        /* istanbul ignore next */
                        logger_service_1["default"].error("{user: {_id: ".concat(req.user._id, ", email: ").concat(req.user.email, "}}"));
                        res.status(500).json(e_2);
                        return [3 /*break*/, 7];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    TransmittalItemController.prototype.apiDelete = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var id, team, transmittalItem, transmittalItems, transmittal, e_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        logger_service_1["default"].info("TransmittalItemController.apiDelete");
                        id = req.params.id;
                        team = req.user.team;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 9, , 10]);
                        return [4 /*yield*/, transmittalItem_model_1["default"].findOne({ _id: id })];
                    case 2:
                        transmittalItem = _a.sent();
                        if (!transmittalItem) return [3 /*break*/, 8];
                        return [4 /*yield*/, transmittalItem.remove()];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, transmittalItem_model_1["default"].find({ transmittal: transmittalItem.transmittal }).count()];
                    case 4:
                        transmittalItems = _a.sent();
                        server_1.io.to("transmittal-list-".concat(team._id)).emit('DELETE_TRANSMITTAL_ITEM', {
                            transmittalItem: transmittalItem
                        });
                        // clear assigned request item
                        return [4 /*yield*/, requestItem_model_1["default"].findOneAndUpdate({
                                _id: transmittalItem.requestItem
                            }, {
                                assigned: false,
                                transmittal: null,
                                transmittalItem: null
                            })];
                    case 5:
                        // clear assigned request item
                        _a.sent();
                        if (!(transmittalItems === 0)) return [3 /*break*/, 8];
                        return [4 /*yield*/, transmittal_model_1["default"].findOne({ _id: transmittalItem.transmittal })];
                    case 6:
                        transmittal = _a.sent();
                        return [4 /*yield*/, transmittal.remove()];
                    case 7:
                        _a.sent();
                        server_1.io.to("transmittal-list-".concat(team._id)).emit('DELETE_TRANSMITTAL', {
                            transmittal: transmittal
                        });
                        _a.label = 8;
                    case 8:
                        res.json({
                            transmittalItem: transmittalItem
                        });
                        return [3 /*break*/, 10];
                    case 9:
                        e_3 = _a.sent();
                        /* istanbul ignore next */
                        logger_service_1["default"].error(e_3);
                        /* istanbul ignore next */
                        logger_service_1["default"].error("TransmittalItemController.apiDelete: Async Error.");
                        /* istanbul ignore next */
                        logger_service_1["default"].error("{user: {_id: ".concat(req.user._id, ", email: ").concat(req.user.email, "}}"));
                        res.status(500).json(e_3);
                        return [3 /*break*/, 10];
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    return TransmittalItemController;
}());
exports["default"] = new TransmittalItemController();
//# sourceMappingURL=transmittalItem.controller.js.map