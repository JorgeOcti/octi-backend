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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
exports.__esModule = true;
var transmittal_model_1 = require("../models/transmittal.model");
var logger_service_1 = require("../../services/logger.service");
var transmittalItem_model_1 = require("../models/transmittalItem.model");
var transmittalFile_model_1 = require("../models/transmittalFile.model");
var general_utils_1 = require("../../utils/general.utils");
var GraphicsMagick = require("gm");
var team_model_1 = require("../../app/models/team.model");
var car_model_1 = require("../../app/models/car.model");
var requestItem_model_1 = require("../../request/models/requestItem.model");
var server_1 = require("../../server");
var excel = require("exceljs");
var moment = require("moment-timezone");
var milestone_model_1 = require("../models/milestone.model");
var form_model_1 = require("../../form/models/form.model");
var scale_model_1 = require("../../form/models/scale.model");
var redis_service_1 = require("../../services/redis.service");
var archiver = require("archiver");
var bluebird = require("bluebird");
var fs = require("fs");
var https = require("https");
var TransmittalController = /** @class */ (function () {
    function TransmittalController() {
        this.itemPopulate = [{
                path: 'car',
                select: ['invoice', 'entry', 'denomination', 'patent', 'material', 'vin', 'brand', 'color', 'bl']
            }, {
                path: 'request',
                select: ['number']
            }, {
                path: 'destination',
                select: ['name']
            }, {
                path: 'origin',
                select: ['name']
            }, {
                path: 'revisions',
                select: ['_id', 'hasDamages', 'receptionConfirmation', 'shippingConfirmation', 'createdAt'],
                options: {
                    sort: {
                        _id: -1
                    }
                }
            }];
        this.populate = [{
                path: 'transporter.carrier',
                select: ['name']
            }, {
                path: 'type',
                select: ['name']
            }, {
                path: 'transporter.driver',
                select: ['firstName', 'lastName']
            }, {
                path: 'items',
                select: ['car', 'requestItem', 'destination', 'origin', 'loadingDate', 'arrivalDate'],
                populate: this.itemPopulate
            }, {
                path: 'files',
                select: ['file', 'thumbnail']
            }, {
                path: 'evidenceFullLoad',
                select: ['file', 'thumbnail']
            }, {
                path: 'createdBy',
                select: ['firstName', 'lastName']
            }];
        this.index = this.index.bind(this);
        this.apiList = this.apiList.bind(this);
        this.apiOnlyMe = this.apiOnlyMe.bind(this);
        this.apiDetail = this.apiDetail.bind(this);
        this.apiCreate = this.apiCreate.bind(this);
        this.apiPatch = this.apiPatch.bind(this);
        this.apiUpdate = this.apiUpdate.bind(this);
        this.apiDelete = this.apiDelete.bind(this);
        this.xlsExport = this.xlsExport.bind(this);
        this.uploadFile = this.uploadFile.bind(this);
        this.downloadTransmittalFiles = this.downloadTransmittalFiles.bind(this);
        this.downloadFile = this.downloadFile.bind(this);
        this.attachEvidence = this.attachEvidence.bind(this);
        this.fillFormSections = this.fillFormSections.bind(this);
        this.getScales = this.getScales.bind(this);
    }
    TransmittalController.prototype.index = function (req, res) {
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
    TransmittalController.prototype.apiDetail = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var id, transmittal, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        logger_service_1["default"].info("TransmittalController.apiDetail");
                        id = req.params.id;
                        return [4 /*yield*/, transmittal_model_1["default"].findById(id).populate(this.populate)];
                    case 1:
                        transmittal = _a.sent();
                        res.json({
                            data: transmittal
                        });
                        return [3 /*break*/, 3];
                    case 2:
                        e_1 = _a.sent();
                        console.log(e_1);
                        /* istanbul ignore next */
                        logger_service_1["default"].error("TransmittalController.apiDetail: Async Error.");
                        /* istanbul ignore next */
                        logger_service_1["default"].error("{user: {_id: ".concat(req.user._id, ", email: ").concat(req.user.email, "}}"));
                        res.status(500).json(e_1);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    TransmittalController.prototype.apiCreate = function (req, res) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var _b, name_1, items, files, transporter, observation, type, user, team, transmittal, _i, items_1, item, transmittalItem, e_2;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 12, , 13]);
                        logger_service_1["default"].info("TransmittalController.apiCreate");
                        _b = req.body, name_1 = _b.name, items = _b.items, files = _b.files, transporter = _b.transporter, observation = _b.observation, type = _b.type;
                        user = req.user;
                        return [4 /*yield*/, team_model_1["default"].findOneAndUpdate({ _id: user.team._id }, { $inc: { transmittalNumber: 1 } }, { "new": true })];
                    case 1:
                        team = _c.sent();
                        return [4 /*yield*/, new transmittal_model_1["default"]({
                                name: name_1,
                                type: type,
                                team: user.team,
                                number: team.transmittalNumber,
                                createdBy: user._id,
                                transporter: transporter,
                                observation: observation
                            }).save()];
                    case 2:
                        transmittal = _c.sent();
                        _i = 0, items_1 = items;
                        _c.label = 3;
                    case 3:
                        if (!(_i < items_1.length)) return [3 /*break*/, 8];
                        item = items_1[_i];
                        // update cars params
                        return [4 /*yield*/, car_model_1["default"].findOneAndUpdate({
                                team: user.team,
                                _id: item.car._id
                            }, {
                                client: item.car.client,
                                bl: item.car.bl
                            })];
                    case 4:
                        // update cars params
                        _c.sent();
                        return [4 /*yield*/, new transmittalItem_model_1["default"](__assign(__assign({}, item), { team: team, transmittal: transmittal, loadingDate: moment().toDate() })).save()];
                    case 5:
                        transmittalItem = _c.sent();
                        if (!((_a = item.requestItem) === null || _a === void 0 ? void 0 : _a.length)) return [3 /*break*/, 7];
                        return [4 /*yield*/, requestItem_model_1["default"].findOneAndUpdate({
                                _id: item.requestItem
                            }, {
                                assigned: true,
                                transmittal: transmittal._id,
                                transmittalItem: transmittalItem._id
                            })];
                    case 6:
                        _c.sent();
                        _c.label = 7;
                    case 7:
                        _i++;
                        return [3 /*break*/, 3];
                    case 8:
                        if (!(files && files.length)) return [3 /*break*/, 11];
                        return [4 /*yield*/, transmittal.updateOne({ files: files })];
                    case 9:
                        _c.sent();
                        return [4 /*yield*/, transmittalFile_model_1["default"].updateMany({
                                _id: { $in: files }
                            }, {
                                $set: { transmittal: transmittal }
                            })];
                    case 10:
                        _c.sent();
                        _c.label = 11;
                    case 11:
                        server_1.io.to("transmittal-list-".concat(team._id)).emit('CREATE_TRANSMITTAL', {
                            transmittal: transmittal
                        });
                        res.json({
                            status: 200
                        });
                        return [3 /*break*/, 13];
                    case 12:
                        e_2 = _c.sent();
                        /* istanbul ignore next */
                        logger_service_1["default"].error("TransmittalController.apiCreate: Async Error.");
                        /* istanbul ignore next */
                        logger_service_1["default"].error("{user: {_id: ".concat(req.user._id, ", email: ").concat(req.user.email, "}}"));
                        res.status(500).json(e_2);
                        return [3 /*break*/, 13];
                    case 13: return [2 /*return*/];
                }
            });
        });
    };
    TransmittalController.prototype.apiUpdate = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                try {
                    // const { id } = req.params;
                    logger_service_1["default"].info("TransmittalController.apiUpdate");
                    res.json({
                        api: 'TransmittalController:apiUpdate'
                    });
                }
                catch (e) {
                    console.log(e);
                    /* istanbul ignore next */
                    logger_service_1["default"].error("TransmittalController.apiUpdate: Async Error.");
                    /* istanbul ignore next */
                    logger_service_1["default"].error("{user: {_id: ".concat(req.user._id, ", email: ").concat(req.user.email, "}}"));
                    res.status(500).json(e);
                }
                return [2 /*return*/];
            });
        });
    };
    TransmittalController.prototype.apiPatch = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var id, transmittal, team, newTransmittal, e_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 9, , 10]);
                        logger_service_1["default"].info("TransmittalController.apiUpdate");
                        id = req.params.id;
                        transmittal = req.body;
                        team = req.user.team;
                        newTransmittal = void 0;
                        if (!transmittal.allLoadingDate) return [3 /*break*/, 3];
                        // update all item loading dates
                        return [4 /*yield*/, transmittalItem_model_1["default"].updateMany({ transmittal: id }, { $set: { loadingDate: transmittal.allLoadingDate } })];
                    case 1:
                        // update all item loading dates
                        _a.sent();
                        return [4 /*yield*/, transmittal_model_1["default"]
                                .findOne({ _id: id })
                                .populate(this.populate)];
                    case 2:
                        newTransmittal = _a.sent();
                        return [3 /*break*/, 8];
                    case 3:
                        if (!transmittal.allArrivalDate) return [3 /*break*/, 6];
                        // update all item arrival dates
                        return [4 /*yield*/, transmittalItem_model_1["default"].updateMany({ transmittal: id }, { $set: { arrivalDate: transmittal.allArrivalDate } })];
                    case 4:
                        // update all item arrival dates
                        _a.sent();
                        return [4 /*yield*/, transmittal_model_1["default"]
                                .findOne({ _id: id })
                                .populate(this.populate)];
                    case 5:
                        newTransmittal = _a.sent();
                        return [3 /*break*/, 8];
                    case 6: return [4 /*yield*/, transmittal_model_1["default"]
                            .findOneAndUpdate({ _id: id }, { $set: transmittal }, { "new": true })
                            .populate(this.populate)];
                    case 7:
                        newTransmittal = _a.sent();
                        _a.label = 8;
                    case 8:
                        server_1.io.to("transmittal-list-".concat(team._id)).emit('UPDATE_TRANSMITTAL', {
                            transmittal: newTransmittal
                        });
                        res.json({
                            data: newTransmittal
                        });
                        return [3 /*break*/, 10];
                    case 9:
                        e_3 = _a.sent();
                        console.log(e_3);
                        /* istanbul ignore next */
                        logger_service_1["default"].error("TransmittalController.apiUpdate: Async Error.");
                        /* istanbul ignore next */
                        logger_service_1["default"].error("{user: {_id: ".concat(req.user._id, ", email: ").concat(req.user.email, "}}"));
                        res.status(500).json(e_3);
                        return [3 /*break*/, 10];
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    TransmittalController.prototype.apiDelete = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                logger_service_1["default"].info("TransmittalController.apiDelete");
                res.json({
                    api: 'TransmittalController:apiDelete'
                });
                return [2 /*return*/];
            });
        });
    };
    TransmittalController.prototype.apiList = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var team, _a, page, pageSize, search, orderBy, orderType, options, filter, transmittals, e_4;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        logger_service_1["default"].info("TransmittalController.apiList");
                        logger_service_1["default"].info("{user: {_id: ".concat(req.user._id, ", email: ").concat(req.user.email, "}}"));
                        team = req.user.team._id;
                        _a = req.query, page = _a.page, pageSize = _a.pageSize, search = _a.search, orderBy = _a.orderBy, orderType = _a.orderType;
                        options = {
                            sort: (_b = {},
                                _b[orderBy || '_id'] = orderType === 'ascending' ? 1 : -1,
                                _b),
                            populate: [{
                                    path: 'revision',
                                    select: ['_id', 'hasDamages']
                                }, {
                                    path: 'transporter.carrier',
                                    select: ['name']
                                }, {
                                    path: 'type',
                                    select: ['name']
                                }, {
                                    path: 'evidenceFullLoad',
                                    select: ['file', 'thumbnail', 'milestone']
                                }, {
                                    path: 'transporter.driver',
                                    select: ['firstName', 'lastName']
                                }, {
                                    path: 'items',
                                    select: ['car', 'requestItem', 'destination', 'origin', 'loadingDate', 'arrivalDate', 'observation'],
                                    populate: this.itemPopulate
                                }, {
                                    path: 'files',
                                    select: ['file', 'thumbnail']
                                }, {
                                    path: 'createdBy',
                                    select: ['firstName', 'lastName']
                                }],
                            page: parseInt(page ? page : '1', 10),
                            limit: parseInt(pageSize ? pageSize : '20', 10)
                        };
                        filter = {
                            team: team
                        };
                        if (search) {
                            // add here conditions to search
                        }
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.getTransmittals(filter, options)];
                    case 2:
                        transmittals = _c.sent();
                        /* istanbul ignore if  */
                        if (options.page && transmittals.pages && transmittals.pages < options.page) {
                            res.status(400).json({
                                message: 'La página solicitada no existe.',
                                status: 400
                            });
                        }
                        else {
                            res.json({
                                count: transmittals.total,
                                pages: transmittals.pages,
                                hasPrevious: options.page && options.page > 1 && transmittals.pages && transmittals.pages >= options.page,
                                hasNext: options.page && transmittals.pages && transmittals.pages > options.page,
                                results: transmittals.docs,
                                status: 200
                            });
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        e_4 = _c.sent();
                        /* istanbul ignore next */
                        logger_service_1["default"].error("TransmittalController.apiList: Async Error.");
                        /* istanbul ignore next */
                        logger_service_1["default"].error("{user: {_id: ".concat(req.user._id, ", email: ").concat(req.user.email, "}}"));
                        res.status(500).json(e_4);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    TransmittalController.prototype.apiOnlyMe = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var team, _a, page, pageSize, orderBy, orderType, options, filter, transmittals, milestones_1, i, milestone, form, e_5;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        logger_service_1["default"].info("TransmittalController.apiOnlyMe");
                        logger_service_1["default"].info("{user: {_id: ".concat(req.user._id, ", email: ").concat(req.user.email, "}}"));
                        team = req.user.team._id;
                        _a = req.query, page = _a.page, pageSize = _a.pageSize, orderBy = _a.orderBy, orderType = _a.orderType;
                        options = {
                            sort: (_b = {},
                                _b[orderBy || '_id'] = orderType === 'ascending' ? 1 : -1,
                                _b),
                            populate: [{
                                    path: 'transporter.carrier',
                                    select: ['name']
                                }, {
                                    path: 'evidenceFullLoad',
                                    select: ['_id', 'milestone']
                                }, {
                                    path: 'transporter.driver',
                                    select: ['firstName', 'lastName']
                                }, {
                                    path: 'items',
                                    select: ['car', 'requestItem', 'destination', 'origin', 'loadingDate', 'arrivalDate', 'revisions'],
                                    populate: [{
                                            path: 'car',
                                            select: ['invoice', 'entry', 'denomination', 'patent', 'material', 'vin', 'brand', 'color']
                                        }, {
                                            path: 'request',
                                            select: ['number']
                                        }, {
                                            path: 'revisions',
                                            select: ['_id', 'hasDamages', 'receptionConfirmation', 'shippingConfirmation', 'createdAt'],
                                            options: {
                                                sort: {
                                                    _id: -1
                                                }
                                            }
                                        }, {
                                            path: 'destination',
                                            select: ['name']
                                        }, {
                                            path: 'origin',
                                            select: ['name']
                                        }]
                                }, {
                                    path: 'createdBy',
                                    select: ['firstName', 'lastName']
                                }],
                            page: parseInt(page ? page : '1', 10),
                            limit: parseInt(pageSize ? pageSize : '20', 10)
                        };
                        filter = {
                            team: team,
                            'transporter.driver': req.user._id,
                            status: {
                                $in: [transmittal_model_1.ChoicesStatusTransmittal.pending, transmittal_model_1.ChoicesStatusTransmittal.inTransit]
                            }
                        };
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 10, , 11]);
                        return [4 /*yield*/, this.getTransmittals(filter, options)];
                    case 2:
                        transmittals = _c.sent();
                        if (!(options.page && transmittals.pages && transmittals.pages < options.page)) return [3 /*break*/, 3];
                        res.status(400).json({
                            message: 'La página solicitada no existe.',
                            status: 400
                        });
                        return [3 /*break*/, 9];
                    case 3: return [4 /*yield*/, milestone_model_1["default"].find({
                            team: team
                        })];
                    case 4:
                        milestones_1 = _c.sent();
                        i = 0;
                        _c.label = 5;
                    case 5:
                        if (!(i < milestones_1.length)) return [3 /*break*/, 8];
                        milestone = milestones_1[i].toObject();
                        return [4 /*yield*/, this.fillFormSections(milestone.form, req.user)];
                    case 6:
                        form = _c.sent();
                        milestones_1[i] = __assign(__assign({}, milestone), form);
                        _c.label = 7;
                    case 7:
                        i++;
                        return [3 /*break*/, 5];
                    case 8:
                        res.json({
                            count: transmittals.total,
                            pages: transmittals.pages,
                            hasPrevious: options.page && options.page > 1 && transmittals.pages && transmittals.pages >= options.page,
                            hasNext: options.page && transmittals.pages && transmittals.pages > options.page,
                            data: transmittals.docs.map(function (transmittal) { return (__assign(__assign({}, transmittal.toObject()), { detailedEvidence: transmittal.evidenceFullLoad, evidenceFullLoad: transmittal.evidenceFullLoad.map(function (e) { return e._id; }), milestones: milestones_1.filter(function (milestone) { return milestone.type.toString() === transmittal.type.toString(); }) })); }),
                            status: 200
                        });
                        _c.label = 9;
                    case 9: return [3 /*break*/, 11];
                    case 10:
                        e_5 = _c.sent();
                        console.error(e_5);
                        /* istanbul ignore next */
                        logger_service_1["default"].error("TransmittalController.apiOnlyMe:", e_5.toString());
                        /* istanbul ignore next */
                        logger_service_1["default"].error("{user: {_id: ".concat(req.user._id, ", email: ").concat(req.user.email, "}}"));
                        res.status(500).json(e_5);
                        return [3 /*break*/, 11];
                    case 11: return [2 /*return*/];
                }
            });
        });
    };
    TransmittalController.prototype.getForm = function (filter) {
        var _this = this;
        var keyCache = "form-".concat(filter._id);
        logger_service_1["default"].debug("keyCache ".concat(keyCache));
        return new Promise(function (resolve, reject) {
            redis_service_1["default"].get(keyCache, function (error, result) { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    if (result) {
                        logger_service_1["default"].debug("FROM CACHE");
                        resolve(JSON.parse(result));
                    }
                    else {
                        logger_service_1["default"].debug("NEW CACHE");
                        form_model_1["default"]
                            .findOne(filter, {
                            'company': false,
                            'updatedAt': false,
                            'createdAt': false,
                            'active': false,
                            'sections.shortName': false,
                            'sections.questions.shortName': false,
                            '__v': false
                        })
                            .populate([{
                                path: 'sections.questions.damages',
                                select: ['name', 'positions', 'kinds', 'parts', 'partFallback', 'kindFallback'],
                                populate: [{
                                        path: 'positions',
                                        select: ['name'],
                                        options: {
                                            sort: {
                                                name: 1
                                            }
                                        }
                                    }, {
                                        path: 'kinds',
                                        select: ['name'],
                                        options: {
                                            sort: {
                                                name: 1
                                            }
                                        }
                                    }, {
                                        path: 'parts',
                                        select: ['name'],
                                        options: {
                                            sort: {
                                                name: 1
                                            }
                                        }
                                    }, {
                                        path: 'kindFallback',
                                        select: ['name'],
                                        options: {
                                            sort: {
                                                name: 1
                                            }
                                        }
                                    }, {
                                        path: 'partFallback',
                                        select: ['name'],
                                        options: {
                                            sort: {
                                                name: 1
                                            }
                                        }
                                    }]
                            }])
                            .lean()
                            .exec(function (err, form) {
                            if (err) {
                                /* istanbul ignore next */
                                return reject(err);
                            }
                            if (form) {
                                redis_service_1["default"].set(keyCache, JSON.stringify(form), 'ex', 60);
                                return resolve(form);
                            }
                            return reject('No se encontro formularío');
                        });
                    }
                    return [2 /*return*/];
                });
            }); });
        });
    };
    TransmittalController.prototype.fillFormSections = function (formID, user) {
        return __awaiter(this, void 0, void 0, function () {
            var form, team, scalesIds_1, extra, extraSection, extraScales, response, scales, baseQuestion_1, e_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        if (!formID) {
                            return [2 /*return*/, {}];
                        }
                        return [4 /*yield*/, this.getForm({
                                _id: formID,
                                team: user.team
                            })];
                    case 1:
                        form = _a.sent();
                        team = user.team;
                        scalesIds_1 = [];
                        form.sections.forEach(function (section) {
                            section.questions.forEach(function (question) {
                                var scaleID = question.scale ? question.scale.toString() : null;
                                if (scaleID && !scalesIds_1.includes(scaleID)) {
                                    scalesIds_1.push(scaleID);
                                }
                            });
                        });
                        extra = {
                            accessories: []
                        };
                        extraSection = {
                            _id: 'extraSection',
                            name: '',
                            questions: [],
                            weight: 0,
                            order: form.sections.length + 1
                        };
                        extraScales = [];
                        response = {};
                        if (form.shippingVenue) {
                            extraSection.questions.push({
                                _id: 'shippingVenue',
                                question: form.shippingVenueText,
                                venues: user.venue.sendTo,
                                kind: form_model_1.KindQuestion.venue,
                                order: extraSection.questions.length + 1
                            });
                        }
                        if (form.shipping) {
                            extraSection.questions.push({
                                _id: 'shipping',
                                question: form.shippingText,
                                scale: 'shipping',
                                kind: form_model_1.KindQuestion.scale,
                                order: extraSection.questions.length + 1
                            });
                            extraScales.push({
                                _id: 'shipping',
                                name: 'shipping',
                                choices: [
                                    {
                                        _id: 'false',
                                        choice: 'No',
                                        backgroundColor: 'red',
                                        requireImage: form.shippingImage,
                                        requireComment: false,
                                        requireAccesories: false,
                                        requireConciliation: false,
                                        value: 0,
                                        order: 1
                                    }, {
                                        _id: 'true',
                                        choice: 'Si',
                                        backgroundColor: 'green',
                                        requireImage: false,
                                        requireComment: false,
                                        requireAccesories: false,
                                        requireConciliation: false,
                                        value: 1,
                                        order: 2
                                    }
                                ]
                            });
                        }
                        if (form.receptionVenue) {
                            extraSection.questions.push({
                                _id: 'receptionVenue',
                                question: form.receptionVenueText,
                                venues: user.venue.receiveFrom,
                                kind: form_model_1.KindQuestion.venue,
                                order: extraSection.questions.length + 1
                            });
                        }
                        if (form.reception) {
                            extraSection.questions.push({
                                _id: 'reception',
                                question: form.receptionText,
                                scale: 'reception',
                                kind: form_model_1.KindQuestion.scale,
                                order: extraSection.questions.length + 1
                            });
                            extraScales.push({
                                _id: 'reception',
                                name: 'reception',
                                choices: [
                                    {
                                        _id: 'false',
                                        choice: 'No',
                                        backgroundColor: 'red',
                                        requireImage: form.receptionImage,
                                        requireComment: false,
                                        requireAccesories: false,
                                        requireConciliation: false,
                                        value: 0,
                                        order: 1
                                    }, {
                                        _id: 'true',
                                        choice: 'Si',
                                        backgroundColor: 'green',
                                        requireImage: false,
                                        requireComment: false,
                                        requireAccesories: false,
                                        requireConciliation: false,
                                        value: 1,
                                        order: 2
                                    }
                                ]
                            });
                        }
                        if (form.carrier && (form.reception || form.shipping)) {
                            extraSection.questions.push({
                                _id: 'carrier',
                                question: form.carrierText,
                                carriers: form.reception ? user.venue.receptionCarriers : user.venue.shippingCarriers,
                                kind: form_model_1.KindQuestion.carrier,
                                order: extraSection.questions.length + 1
                            });
                        }
                        if (form.conciliation) {
                            extraSection.questions.push({
                                _id: 'conciliation',
                                question: form.conciliationText,
                                scale: 'conciliation',
                                kind: form_model_1.KindQuestion.scale,
                                order: extraSection.questions.length + 1
                            });
                            extraScales.push({
                                _id: 'conciliation',
                                name: 'conciliation',
                                choices: [
                                    {
                                        _id: 'false',
                                        choice: 'No',
                                        backgroundColor: 'red',
                                        requireImage: false,
                                        requireComment: false,
                                        requireAccesories: false,
                                        requireConciliation: false,
                                        value: 0,
                                        order: 1
                                    }, {
                                        _id: 'true',
                                        choice: 'Si',
                                        backgroundColor: 'green',
                                        requireImage: form.conciliationImage,
                                        requireComment: false,
                                        requireAccesories: false,
                                        requireConciliation: false,
                                        value: 1,
                                        order: 2
                                    }
                                ]
                            });
                        }
                        return [4 /*yield*/, this.getScales({
                                _id: {
                                    $in: scalesIds_1
                                },
                                team: team
                            })];
                    case 2:
                        scales = _a.sent();
                        scales = __spreadArray(__spreadArray([], scales, true), extraScales, true);
                        if (extraSection.questions.length) {
                            form.sections = __spreadArray(__spreadArray([], form.sections, true), [extraSection], false);
                        }
                        baseQuestion_1 = {
                            _id: '',
                            question: '',
                            scale: null,
                            risk: '',
                            observe: '',
                            accessories: null,
                            damages: null,
                            venues: [],
                            carriers: [],
                            conciliation: false,
                            kind: '',
                            weight: 0,
                            order: 0,
                            optional: false,
                            hint: ''
                        };
                        // get scales from db
                        return [2 /*return*/, __assign({ form: {
                                    _id: form._id,
                                    name: form.name,
                                    description: form.description,
                                    // norrmalize questions in sections
                                    sections: form.sections.map(function (section) {
                                        return {
                                            _id: section._id,
                                            name: section.name,
                                            questions: section.questions.map(function (question) {
                                                return __assign(__assign({}, baseQuestion_1), question);
                                            }),
                                            weight: section.weight,
                                            order: section.order
                                        };
                                    })
                                }, scales: scales, extra: extra }, response)];
                    case 3:
                        e_6 = _a.sent();
                        /* istanbul ignore next */
                        logger_service_1["default"].error("TransmittalController.apiOnlyMe:", e_6);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    TransmittalController.prototype.getScales = function (filter) {
        var _this = this;
        var keyCache = "scales-".concat(JSON.stringify(filter));
        return new Promise(function (resolve, reject) {
            redis_service_1["default"].get(keyCache, function (error, result) { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    if (result) {
                        resolve(JSON.parse(result));
                    }
                    else {
                        scale_model_1["default"]
                            .find(filter, {
                            'updatedAt': false,
                            'createdAt': false,
                            'active': false,
                            'company': false,
                            'minValue': false,
                            'maxValue': false,
                            'choices.na': false,
                            'team': false,
                            '__v': false
                        })
                            .lean()
                            .exec(function (err, scales) {
                            if (err) {
                                /* istanbul ignore next */
                                return reject(err);
                            }
                            redis_service_1["default"].set(keyCache, JSON.stringify(scales), 'ex', 30);
                            return resolve(scales);
                        });
                    }
                    return [2 /*return*/];
                });
            }); });
        });
    };
    TransmittalController.prototype.attachEvidence = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var user, _a, files, transmittal, transmittalData, e_7;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        user = req.user;
                        _a = req.body, files = _a.files, transmittal = _a.transmittal;
                        logger_service_1["default"].info("TransmittalController.attachEvidence");
                        logger_service_1["default"].info("{user: {_id: ".concat(req.user._id, ", email: ").concat(req.user.email, "}}"));
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 4, , 5]);
                        if (!files) return [3 /*break*/, 3];
                        return [4 /*yield*/, transmittal_model_1["default"]
                                .findOneAndUpdate({
                                _id: transmittal,
                                team: user.team._id
                            }, {
                                $push: { evidenceFullLoad: files },
                                status: transmittal_model_1.ChoicesStatusTransmittal.inTransit
                            }, { "new": true })];
                    case 2:
                        transmittalData = _b.sent();
                        res.status(200).json({
                            data: transmittalData,
                            status: 201
                        });
                        _b.label = 3;
                    case 3:
                        res.status(400).json({
                            message: 'El archivo es requerido',
                            status: 400
                        });
                        return [3 /*break*/, 5];
                    case 4:
                        e_7 = _b.sent();
                        /* istanbul ignore next */
                        logger_service_1["default"].error("TransmittalController.uploadFile: Async Error.");
                        /* istanbul ignore next */
                        logger_service_1["default"].error("{user: {_id: ".concat(req.user._id, ", email: ").concat(req.user.email, "}}"));
                        /* istanbul ignore next */
                        logger_service_1["default"].error(e_7);
                        /* istanbul ignore next */
                        res.status(400).json(e_7);
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    TransmittalController.prototype.xlsExport = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var team, columns, options, workbook_1, worksheet_1, cursor_1, e_8;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        logger_service_1["default"].info("TransmittalController.xlsExport");
                        logger_service_1["default"].info("{user: {_id: ".concat(req.user._id, ", email: ").concat(req.user.email, "}}"));
                        team = req.user.team._id;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        columns = [{
                                header: '# Orden transporte', key: 'transmittalNumber', width: 30
                            }, {
                                header: '# Solicitud', key: 'requestNumber', width: 30
                            }, {
                                header: 'Chofer', key: 'driver', width: 30
                            }, {
                                header: 'Transportista', key: 'carrier', width: 30
                            }, {
                                header: 'VIN', key: 'vin', width: 30
                            }, {
                                header: 'Marca', key: 'brand', width: 30
                            }, {
                                header: 'Modelo', key: 'denomination', width: 30
                            }, {
                                header: 'Color', key: 'color', width: 30
                            }, {
                                header: 'Observación', key: 'observation', width: 30
                            }, {
                                header: 'Fecha', key: 'createdAt', width: 30, style: {
                                    numFmt: 'dd/mm/yyyy hh:mm'
                                }
                            }];
                        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                        res.setHeader('Content-Disposition', "attachment; filename=distribution-".concat(moment().format('YYYY-MM-DD'), ".xlsx"));
                        options = {
                            stream: res,
                            useStyles: true,
                            useSharedStrings: true
                        };
                        workbook_1 = new excel.stream.xlsx.WorkbookWriter(options);
                        worksheet_1 = workbook_1.addWorksheet('Rotación de unidades', {
                            pageSetup: {
                                fitToPage: true, fitToHeight: 100, fitToWidth: 1
                            }
                        });
                        worksheet_1.columns = columns;
                        return [4 /*yield*/, transmittal_model_1["default"]
                                .find({ team: team })
                                .populate([{
                                    path: 'transporter.carrier',
                                    select: ['name']
                                }, {
                                    path: 'transporter.driver',
                                    select: ['firstName', 'lastName']
                                }, {
                                    path: 'items',
                                    select: ['car', 'requestItem', 'destination', 'origin', 'loadingDate', 'arrivalDate', 'observation', 'createdAt'],
                                    populate: this.itemPopulate
                                }, {
                                    path: 'files',
                                    select: ['file', 'thumbnail']
                                }, {
                                    path: 'createdBy',
                                    select: ['firstName', 'lastName']
                                }])
                                .batchSize(100)
                                .cursor()];
                    case 2:
                        cursor_1 = _a.sent();
                        cursor_1.on('data', function (transmittal) { return __awaiter(_this, void 0, void 0, function () {
                            var _i, _a, item;
                            var _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
                            return __generator(this, function (_m) {
                                // const row = await this.processParticipant(participant);
                                for (_i = 0, _a = transmittal.items; _i < _a.length; _i++) {
                                    item = _a[_i];
                                    worksheet_1.addRow({
                                        transmittalNumber: transmittal.number,
                                        requestNumber: item.request.number,
                                        driver: "".concat((_c = (_b = transmittal.transporter) === null || _b === void 0 ? void 0 : _b.driver) === null || _c === void 0 ? void 0 : _c.firstName, " ").concat((_e = (_d = transmittal.transporter) === null || _d === void 0 ? void 0 : _d.driver) === null || _e === void 0 ? void 0 : _e.lastName),
                                        carrier: (_g = (_f = transmittal.transporter) === null || _f === void 0 ? void 0 : _f.carrier) === null || _g === void 0 ? void 0 : _g.name,
                                        vin: (_h = item.car) === null || _h === void 0 ? void 0 : _h.vin,
                                        brand: (_j = item.car) === null || _j === void 0 ? void 0 : _j.brand,
                                        denomination: (_k = item.car) === null || _k === void 0 ? void 0 : _k.denomination,
                                        color: (_l = item.car) === null || _l === void 0 ? void 0 : _l.color,
                                        observation: item.observation,
                                        createdAt: item.createdAt
                                    }).commit();
                                }
                                return [2 /*return*/];
                            });
                        }); });
                        // code to handle connection abort or finish query read process
                        cursor_1.on('end', function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, workbook_1.commit()];
                                    case 1:
                                        _a.sent();
                                        res.status(200);
                                        return [2 /*return*/];
                                }
                            });
                        }); });
                        cursor_1.on('error', function (error) { return logger_service_1["default"].error(error.message); });
                        // code to handle connection abort or finish of data send
                        req.connection.on('close', function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, cursor_1.close()];
                                    case 1:
                                        _a.sent();
                                        res.status(200);
                                        return [2 /*return*/];
                                }
                            });
                        }); });
                        return [3 /*break*/, 4];
                    case 3:
                        e_8 = _a.sent();
                        /* istanbul ignore next */
                        logger_service_1["default"].error("TransmittalController.xlsExport: Async Error.");
                        /* istanbul ignore next */
                        logger_service_1["default"].error("{user: {_id: ".concat(req.user._id, ", email: ").concat(req.user.email, "}}"));
                        /* istanbul ignore next */
                        logger_service_1["default"].error(e_8);
                        /* istanbul ignore next */
                        res.status(500).json(e_8);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    TransmittalController.prototype.getTransmittals = function (filter, options) {
        return new Promise(function (resolve, reject) {
            transmittal_model_1["default"].paginate(filter, options, function (err, result) {
                if (err) {
                    return reject(err);
                }
                return resolve(result);
            });
        });
    };
    TransmittalController.prototype.uploadFile = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var user, _a, transmittal, milestone, file, transmittaltFile, e_9, e_10, newTransmittal, e_11;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        user = req.user;
                        _a = req.body, transmittal = _a.transmittal, milestone = _a.milestone;
                        logger_service_1["default"].info("TransmittalController.uploadFile");
                        logger_service_1["default"].info("{user: {_id: ".concat(req.user._id, ", email: ").concat(req.user.email, "}}"));
                        file = general_utils_1["default"].getFileFromRequest(req.files, 'file');
                        if (!file) return [3 /*break*/, 17];
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 15, , 16]);
                        transmittaltFile = new transmittalFile_model_1["default"]();
                        /*
                          {
                            fieldname: 'file',
                            originalname: 'Captura de pantalla 2018-06-28 a la(s) 11.59.58.png',
                            encoding: '7bit',
                            mimetype: 'image/png',
                            destination: '/tmp/',
                            filename: 'Captura de pantalla 2018-06-28 a la(s) 11.59.58.png',
                            path: '/tmp/Captura de pantalla 2018-06-28 a la(s) 11.59.58.png',
                            size: 794429
                          }
                        */
                        file.headers = {
                            'Content-Type': file.mimetype
                        };
                        file.team = user.team._id;
                        transmittaltFile.user = user._id;
                        transmittaltFile.team = user.team._id;
                        if ((transmittal === null || transmittal === void 0 ? void 0 : transmittal.length) && (milestone === null || milestone === void 0 ? void 0 : milestone.length)) {
                            transmittal = transmittal.replace(/["']/g, "");
                            milestone = milestone.replace(/["']/g, "");
                            transmittaltFile.milestone = milestone;
                            transmittaltFile.transmittal = transmittal;
                        }
                        if (!new RegExp('\\bimage\\b').test(file.mimetype)) return [3 /*break*/, 5];
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, this.autoRotate(file.path)];
                    case 3:
                        _b.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        e_9 = _b.sent();
                        logger_service_1["default"].error('TransmittalController.uploadFile: Error making autoRotate');
                        return [3 /*break*/, 5];
                    case 5: return [4 /*yield*/, transmittaltFile.attach('file', file)];
                    case 6:
                        _b.sent();
                        if (!new RegExp('\\bimage\\b').test(file.mimetype)) return [3 /*break*/, 11];
                        _b.label = 7;
                    case 7:
                        _b.trys.push([7, 10, , 11]);
                        return [4 /*yield*/, this.resizeImage(file.path)];
                    case 8:
                        _b.sent();
                        return [4 /*yield*/, transmittaltFile.attach('thumbnail', file)];
                    case 9:
                        _b.sent();
                        return [3 /*break*/, 11];
                    case 10:
                        e_10 = _b.sent();
                        logger_service_1["default"].error('TransmittalController.uploadFile: Error making thumbnail');
                        return [3 /*break*/, 11];
                    case 11: return [4 /*yield*/, transmittaltFile.save()];
                    case 12:
                        _b.sent();
                        if (!(transmittal === null || transmittal === void 0 ? void 0 : transmittal.length)) return [3 /*break*/, 14];
                        return [4 /*yield*/, transmittal_model_1["default"]
                                .findOneAndUpdate({ _id: transmittal }, { $push: { files: transmittaltFile } }, { "new": true })
                                .populate(this.populate)];
                    case 13:
                        newTransmittal = _b.sent();
                        server_1.io.to("transmittal-list-".concat(user.team._id)).emit('UPDATE_TRANSMITTAL', {
                            transmittal: newTransmittal
                        });
                        _b.label = 14;
                    case 14:
                        res.status(201).json({
                            data: {
                                _id: transmittaltFile._id,
                                file: transmittaltFile.file
                            },
                            status: 201
                        });
                        return [3 /*break*/, 16];
                    case 15:
                        e_11 = _b.sent();
                        /* istanbul ignore next */
                        logger_service_1["default"].error("TransmittalController.uploadFile: Async Error.");
                        /* istanbul ignore next */
                        logger_service_1["default"].error("{user: {_id: ".concat(req.user._id, ", email: ").concat(req.user.email, "}}"));
                        /* istanbul ignore next */
                        logger_service_1["default"].error(e_11);
                        /* istanbul ignore next */
                        res.status(400).json(e_11);
                        return [3 /*break*/, 16];
                    case 16: return [3 /*break*/, 18];
                    case 17:
                        logger_service_1["default"].error("TransmittalController.uploadFile: The file are required.");
                        logger_service_1["default"].error("{user: {_id: ".concat(req.user._id, ", email: ").concat(req.user.email, "}}"));
                        /* istanbul ignore next */
                        res.status(400).json({
                            message: 'La imagen es obligatoria.',
                            status: 400
                        });
                        _b.label = 18;
                    case 18: return [2 /*return*/];
                }
            });
        });
    };
    TransmittalController.prototype.downloadTransmittalFiles = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var id, team, transmittal, archive_1, filename_1, filesToDownload, filesToCompress, _loop_1, _i, _a, file, results, numb, _b, e_12;
            var _this = this;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        id = req.params.id;
                        team = req.user.team._id;
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 8, , 9]);
                        console.log('**downloadTransmittalFiles', id);
                        return [4 /*yield*/, transmittal_model_1["default"]
                                .findOne({ _id: id, team: team })
                                .populate({
                                path: 'files'
                            })];
                    case 2:
                        transmittal = _c.sent();
                        if (!transmittal) return [3 /*break*/, 6];
                        archive_1 = archiver('zip', {
                            zlib: {
                                level: 0
                            }
                        });
                        archive_1.on('error', function (err) {
                            res.status(500).send({
                                error: err.message
                            });
                        });
                        filename_1 = "transmittal-".concat(transmittal.number, ".zip");
                        archive_1.on('end', function () {
                            console.log("".concat(filename_1, ": Archive wrote ").concat((archive_1.pointer() / (1024 * 1024)).toFixed(2), "MB"));
                        });
                        res.attachment(filename_1);
                        filesToDownload = [];
                        filesToCompress = [];
                        _loop_1 = function (file) {
                            var destDirectory = "/tmp/".concat(file._id, "_").concat(file.file.name);
                            filesToDownload.push(function () { return _this.downloadFile(decodeURI(file.file.url), destDirectory); });
                            filesToCompress.push({
                                destDirectory: destDirectory,
                                name: file.file.name
                            });
                        };
                        for (_i = 0, _a = transmittal.files; _i < _a.length; _i++) {
                            file = _a[_i];
                            _loop_1(file);
                        }
                        // download files
                        console.log('EXECUTE PROMISES');
                        results = [];
                        numb = 1;
                        _c.label = 3;
                    case 3:
                        if (!filesToDownload.length) return [3 /*break*/, 5];
                        console.log('promise', numb);
                        _b = [__spreadArray([], results, true)];
                        return [4 /*yield*/, bluebird.all(filesToDownload.splice(0, 20).map(function (promise) { return promise(); }))];
                    case 4:
                        results = __spreadArray.apply(void 0, _b.concat([_c.sent(), true]));
                        numb++;
                        return [3 /*break*/, 3];
                    case 5:
                        // compress files
                        console.log('EXECUTE COMPRESS');
                        filesToCompress.map(function (file) {
                            archive_1.file(file.destDirectory, {
                                name: file.name
                            });
                            setTimeout(function () {
                                if (fs.existsSync(file.destDirectory)) {
                                    console.log("clear ".concat(file.destDirectory));
                                    fs.unlink(file.destDirectory, function (err) {
                                        if (err) {
                                            console.log(err);
                                        }
                                    });
                                }
                            }, 7200000);
                        });
                        console.log('results', results);
                        res.setHeader('size', results.reduce(function (a, b) { return a + b; }));
                        archive_1.pipe(res);
                        archive_1.finalize();
                        return [3 /*break*/, 7];
                    case 6:
                        res.status(404).json({ message: 'Not found' });
                        _c.label = 7;
                    case 7: return [3 /*break*/, 9];
                    case 8:
                        e_12 = _c.sent();
                        /* istanbul ignore next */
                        logger_service_1["default"].error(e_12);
                        /* istanbul ignore next */
                        logger_service_1["default"].error("TransmittalController.downloadItemFiles: Async Error.");
                        /* istanbul ignore next */
                        logger_service_1["default"].error("{user: {_id: ".concat(req.user._id, ", email: ").concat(req.user.email, "}}"));
                        res.status(500).json(e_12);
                        return [3 /*break*/, 9];
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    TransmittalController.prototype.downloadFile = function (url, dest) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
                        var directories, directoyName, file_1;
                        return __generator(this, function (_a) {
                            try {
                                directories = dest.split('/');
                                directories.pop();
                                directoyName = directories.join('/');
                                if (!fs.existsSync(directoyName)) {
                                    fs.mkdirSync(directoyName, { recursive: true });
                                }
                                file_1 = fs.createWriteStream(dest);
                                // download file
                                https.get(url, function (response) {
                                    response.pipe(file_1);
                                    file_1.on('finish', function () {
                                        file_1.close();
                                        resolve(response.headers['content-length'] ? parseInt(response.headers['content-length'], 10) : 0);
                                    });
                                });
                            }
                            catch (e) {
                                // Validate that the file exists and delete it if it exists.
                                if (fs.existsSync(dest)) {
                                    fs.unlink(dest, function (err) {
                                        if (err) {
                                            reject(err);
                                        }
                                    });
                                }
                                else {
                                    console.log(url);
                                    reject(e);
                                }
                            }
                            return [2 /*return*/];
                        });
                    }); })];
            });
        });
    };
    TransmittalController.prototype.autoRotate = function (path) {
        // doc http://aheckmann.github.io/gm/docs.html
        /**** REQUIRE *****
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
    TransmittalController.prototype.resizeImage = function (path) {
        // doc http://aheckmann.github.io/gm/docs.html
        /**** REQUIRE *****
         brew install imagemagick
         brew install graphicsmagick
         * */
        return new Promise(function (resolve, reject) {
            GraphicsMagick(path)
                .resize(100, 100)
                .write(path, function (err) {
                if (err) {
                    /* istanbul ignore next */
                    reject(err);
                }
                else {
                    resolve(true);
                }
            });
        });
    };
    return TransmittalController;
}());
exports["default"] = new TransmittalController();
//# sourceMappingURL=transmittal.controller.js.map