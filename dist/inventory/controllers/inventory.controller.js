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
var archiver = require("archiver");
var bluebird = require("bluebird");
var bson_1 = require("bson");
var excel = require("exceljs");
var fs = require("fs");
var GraphicsMagick = require("gm");
var https = require("https");
var moment = require("moment");
var mongoose = require("mongoose");
var Raven = require("raven");
var tempfile = require("tempfile");
var app_1 = require("../../app");
var car_model_1 = require("../../app/models/car.model");
var team_model_1 = require("../../app/models/team.model");
var teamSetting_model_1 = require("../../app/models/teamSetting.model");
var user_model_1 = require("../../app/models/user.model");
var venue_model_1 = require("../../app/models/venue.model");
var activityHistory_model_1 = require("../../billing/models/activityHistory.model");
var server_1 = require("../../server");
var logger_service_1 = require("../../services/logger.service");
var push_service_1 = require("../../services/push.service");
var general_utils_1 = require("../../utils/general.utils");
var inventory_model_1 = require("../models/inventory.model");
var inventoryCar_model_1 = require("../models/inventoryCar.model");
var inventoryFile_model_1 = require("../models/inventoryFile.model");
var inventoryLabel_model_1 = require("../models/inventoryLabel.model");
var stock_model_1 = require("../models/stock.model");
var stockCar_model_1 = require("../models/stockCar.model");
var inventoryFile_model_2 = require("../models/inventoryFile.model");
var InventoryController = /** @class */ (function () {
    function InventoryController() {
        this.index = this.index.bind(this);
        this.stock = this.stock.bind(this);
        this.detail = this.detail.bind(this);
        this.create = this.create.bind(this);
        this.list = this.list.bind(this);
        this.detaill = this.detaill.bind(this);
        this.apiList = this.apiList.bind(this);
        this.apiDetail = this.apiDetail.bind(this);
        this.apiFoundCar = this.apiFoundCar.bind(this);
        this.uploadFile = this.uploadFile.bind(this);
        this.autoRotate = this.autoRotate.bind(this);
        this.resizeImage = this.resizeImage.bind(this);
        this.setLabel = this.setLabel.bind(this);
        this.finishInventory = this.finishInventory.bind(this);
        this.deleteInventory = this.deleteInventory.bind(this);
        this.reportCar = this.reportCar.bind(this);
        this.addComment = this.addComment.bind(this);
        this.downloadFile = this.downloadFile.bind(this);
        this.downloadImages = this.downloadImages.bind(this);
        this.inventoryByCars = this.inventoryByCars.bind(this);
        this.dashboard = this.dashboard.bind(this);
        this.currentStock = this.currentStock.bind(this);
        this.loadStock = this.loadStock.bind(this);
        this.listInventoryCarFiles = this.listInventoryCarFiles.bind(this);
    }
    InventoryController.prototype.index = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, _b, _c, e_1;
            var _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        _e.trys.push([0, 2, , 3]);
                        _b = (_a = res).render;
                        _c = ['app/index'];
                        _d = {};
                        return [4 /*yield*/, req.user.generateToken()];
                    case 1:
                        _b.apply(_a, _c.concat([(_d.token = _e.sent(),
                                _d)]));
                        return [3 /*break*/, 3];
                    case 2:
                        e_1 = _e.sent();
                        console.log(e_1);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    InventoryController.prototype.stock = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, _b, _c, e_2;
            var _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        _e.trys.push([0, 2, , 3]);
                        _b = (_a = res).render;
                        _c = ['app/index'];
                        _d = {};
                        return [4 /*yield*/, req.user.generateToken()];
                    case 1:
                        _b.apply(_a, _c.concat([(_d.token = _e.sent(),
                                _d)]));
                        return [3 /*break*/, 3];
                    case 2:
                        e_2 = _e.sent();
                        console.log(e_2);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    InventoryController.prototype.detail = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var team, id, inventory, _a, _b, _c, e_3;
            var _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        team = req.user.team._id;
                        id = req.params.id;
                        _e.label = 1;
                    case 1:
                        _e.trys.push([1, 6, , 7]);
                        return [4 /*yield*/, inventory_model_1["default"].findOne({ _id: id, team: team })];
                    case 2:
                        inventory = _e.sent();
                        if (!!inventory) return [3 /*break*/, 3];
                        return [2 /*return*/, res.status(404).render('404')];
                    case 3:
                        _b = (_a = res).render;
                        _c = ['app/index'];
                        _d = {};
                        return [4 /*yield*/, req.user.generateToken()];
                    case 4:
                        _b.apply(_a, _c.concat([(_d.token = _e.sent(), _d)]));
                        _e.label = 5;
                    case 5: return [3 /*break*/, 7];
                    case 6:
                        e_3 = _e.sent();
                        /* istanbul ignore next */
                        if (e_3) {
                            res.status(500).send(e_3);
                        }
                        return [3 /*break*/, 7];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    InventoryController.prototype.listInventoryCarFiles = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var inventoryCarId, inventoryCar, e_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        inventoryCarId = req.params.id;
                        return [4 /*yield*/, inventoryCar_model_1["default"]
                                .findOne({ _id: inventoryCarId })
                                .populate({ path: 'files' })];
                    case 1:
                        inventoryCar = _a.sent();
                        if (!inventoryCar) {
                            res.status(404).json({ message: 'No encomtrado' });
                        }
                        else {
                            res.json(inventoryCar);
                        }
                        return [3 /*break*/, 3];
                    case 2:
                        e_4 = _a.sent();
                        /* istanbul ignore next */
                        if (e_4) {
                            res.status(500).send(e_4);
                        }
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    InventoryController.prototype.create = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, company, team, _b, name, manualPhoto, reportPhoto, _c, carsByVenue, notification, inventoryCars, activityHistories, venuesIDs, _i, carsByVenue_1, venue, venueRegExp, currentVenue, _d, _e, car, currentCar, inventory_1, file, backup, usersIDs, currentTeam, e_5;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        _a = req.user, company = _a.company, team = _a.team;
                        _b = req.body, name = _b.name, manualPhoto = _b.manualPhoto, reportPhoto = _b.reportPhoto;
                        _c = req.body, carsByVenue = _c.carsByVenue, notification = _c.notification;
                        carsByVenue = JSON.parse(carsByVenue);
                        notification = notification === 'true';
                        _f.label = 1;
                    case 1:
                        _f.trys.push([1, 23, , 24]);
                        inventoryCars = [];
                        activityHistories = [];
                        venuesIDs = [];
                        _i = 0, carsByVenue_1 = carsByVenue;
                        _f.label = 2;
                    case 2:
                        if (!(_i < carsByVenue_1.length)) return [3 /*break*/, 12];
                        venue = carsByVenue_1[_i];
                        if (!(venue.name && venue.name.trim().length)) return [3 /*break*/, 11];
                        venueRegExp = new RegExp("^".concat(venue.name.trim(), "$"), 'i');
                        return [4 /*yield*/, venue_model_1["default"].findOne({
                                team: team,
                                name: venueRegExp
                            })];
                    case 3:
                        currentVenue = _f.sent();
                        if (!(currentVenue === null)) return [3 /*break*/, 5];
                        currentVenue = new venue_model_1["default"]({
                            name: venue.name.trim(),
                            team: team,
                            company: company
                        });
                        return [4 /*yield*/, currentVenue.save()];
                    case 4:
                        _f.sent();
                        _f.label = 5;
                    case 5:
                        venuesIDs.push(currentVenue._id.toString());
                        if (!(venue.cars && venue.cars.length)) return [3 /*break*/, 11];
                        _d = 0, _e = venue.cars;
                        _f.label = 6;
                    case 6:
                        if (!(_d < _e.length)) return [3 /*break*/, 11];
                        car = _e[_d];
                        return [4 /*yield*/, car_model_1["default"].findOne({
                                team: team,
                                vin: car.vin.trim()
                            })];
                    case 7:
                        currentCar = _f.sent();
                        if (!(currentCar === null && car.vin && car.vin.trim().length)) return [3 /*break*/, 9];
                        currentCar = new car_model_1["default"]({
                            team: team,
                            company: company,
                            vin: car.vin,
                            vin2: car.vin.substr(car.vin.length - 6),
                            color: car.color,
                            type: car.type,
                            property: car.property,
                            denomination: car.denomination,
                            brand: car.brand,
                            patent: car.patent,
                            createdBy: req.user,
                            status: car_model_1.ChoicesStatusCar.active
                        });
                        return [4 /*yield*/, currentCar.save()];
                    case 8:
                        _f.sent();
                        _f.label = 9;
                    case 9:
                        if (currentVenue && currentCar) {
                            inventoryCars.push({
                                venue: currentVenue._id,
                                car: currentCar._id,
                                comments: [],
                                images: []
                            });
                            activityHistories.push({
                                team: team,
                                company: company,
                                user: req.user._id,
                                type: activityHistory_model_1.ChoicesTypeActivity.inventory,
                                car: {
                                    _id: currentCar._id,
                                    vin: currentCar.vin
                                }
                            });
                            app_1.queue
                                .create('updateCar', {
                                title: "updateCar ".concat(car.vin),
                                currentCar: currentCar._id,
                                car: car
                            })
                                .delay(10000)
                                .priority('high')
                                .attempts(5)
                                .save();
                        }
                        _f.label = 10;
                    case 10:
                        _d++;
                        return [3 /*break*/, 6];
                    case 11:
                        _i++;
                        return [3 /*break*/, 2];
                    case 12:
                        inventory_1 = new inventory_model_1["default"]({
                            name: name,
                            company: company,
                            team: team,
                            venues: venuesIDs,
                            createdBy: req.user._id,
                            status: inventory_model_1.ChoicesStatusInventory.inProcess,
                            settings: {
                                photos: {
                                    manual: manualPhoto,
                                    report: reportPhoto
                                }
                            }
                        });
                        file = general_utils_1["default"].getFileFromRequest(req.files, 'file');
                        if (!file) return [3 /*break*/, 14];
                        file.team = team;
                        return [4 /*yield*/, inventory_1.attach('file', file)];
                    case 13:
                        _f.sent();
                        _f.label = 14;
                    case 14:
                        backup = general_utils_1["default"].getFileFromRequest(req.files, 'backup');
                        if (!backup) return [3 /*break*/, 16];
                        backup.team = team;
                        return [4 /*yield*/, inventory_1.attach('backup', backup)];
                    case 15:
                        _f.sent();
                        _f.label = 16;
                    case 16: return [4 /*yield*/, inventory_1.save()];
                    case 17:
                        _f.sent();
                        inventoryCars.map(function (i) {
                            i.inventory = inventory_1._id;
                            return i;
                        });
                        activityHistories.map(function (a) {
                            a.inventory = {
                                _id: inventory_1._id,
                                name: inventory_1.name
                            };
                            return a;
                        });
                        return [4 /*yield*/, activityHistory_model_1["default"].insertMany(activityHistories)];
                    case 18:
                        _f.sent();
                        return [4 /*yield*/, inventoryCar_model_1["default"].insertMany(inventoryCars)];
                    case 19:
                        _f.sent();
                        if (!notification) return [3 /*break*/, 21];
                        return [4 /*yield*/, user_model_1["default"].find({
                                venue: {
                                    $in: venuesIDs
                                },
                                team: team
                            }, {
                                _id: true
                            })];
                    case 20:
                        usersIDs = _f.sent();
                        push_service_1["default"].massiveSend('Nuevo inventario', "Se ha iniciado el inventario \"".concat(inventory_1.name, "\""), 'Ya puedes empezar a escanear', usersIDs.map(function (user) { return user._id.toString(); }));
                        _f.label = 21;
                    case 21:
                        server_1.io.to("inventory-list-".concat(team)).emit('REFRESH', {
                            update: true
                        });
                        server_1.io.to("stock-".concat(team)).emit('REFRESH', {
                            update: true
                        });
                        return [4 /*yield*/, team_model_1["default"].findById(req.user.team._id)];
                    case 22:
                        currentTeam = _f.sent();
                        app_1.queue
                            .create('email', {
                            from: '',
                            title: "Inventory Notification",
                            to: "\"soporte\"<soporte@osacontrol.com>",
                            subject: "".concat(req.user.firstName, " ha creado un inventario en ").concat(currentTeam.name),
                            text: "Hola Soporte\n\n          Se ha creado un nuevo inventario.\n\n          Team: ".concat(team.name, "\n          Usuario: ").concat(req.user.firstName, " ").concat(req.user.lastName, "\n          ENV: ").concat(process.env.ENV, "\n\n          En caso de dudas o consultas puedes contactarte a soporte@osacontrol.com o a nuestro twitter@TaskforceOSA."),
                            view: 'alerts/inventoryNotification',
                            context: {
                                team: currentTeam,
                                user: req.user,
                                env: process.env.ENV
                            }
                        })
                            .priority('high')
                            .attempts(5)
                            .save();
                        res.json({
                            _id: inventory_1._id.toString(),
                            message: 'Inventario creado satisfactoriamente',
                            status: 200
                        });
                        return [3 /*break*/, 24];
                    case 23:
                        e_5 = _f.sent();
                        /* istanbul ignore next */
                        logger_service_1["default"].error("create: Async Error.");
                        /* istanbul ignore next */
                        logger_service_1["default"].error("{user: {_id: ".concat(req.user._id, ", email: ").concat(req.user.email, "}}"));
                        /* istanbul ignore next */
                        logger_service_1["default"].error(e_5);
                        /* istanbul ignore next */
                        res.status(500).json({
                            message: e_5,
                            status: 500
                        });
                        return [3 /*break*/, 24];
                    case 24: return [2 /*return*/];
                }
            });
        });
    };
    InventoryController.prototype.list = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var team, _a, page, pageSize, venuesPermissions, options, paginatedInventories, response, inventories, _i, inventories_1, inventory, defaultResults, teamSettings, e_6;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        team = req.user.team._id;
                        _a = req.query, page = _a.page, pageSize = _a.pageSize;
                        venuesPermissions = req.user.venuesPermissions();
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 7, , 8]);
                        options = {
                            select: {
                                _id: true
                            },
                            sort: {
                                createdAt: -1
                            },
                            page: parseInt(page ? page : '1', 10),
                            limit: parseInt(pageSize ? pageSize : '10', 10)
                        };
                        return [4 /*yield*/, inventory_model_1["default"].paginate({
                                team: team,
                                venues: {
                                    $in: venuesPermissions
                                }
                            }, options)];
                    case 2:
                        paginatedInventories = _c.sent();
                        if (!(options.page && paginatedInventories.pages && paginatedInventories.pages < options.page)) return [3 /*break*/, 3];
                        res.status(400).json({
                            message: 'La página solicitada no existe.',
                            status: 200
                        });
                        return [3 /*break*/, 6];
                    case 3:
                        response = [];
                        return [4 /*yield*/, inventory_model_1["default"].aggregate([{
                                    $match: {
                                        _id: {
                                            $in: paginatedInventories.docs.map(function (v) { return v._id; })
                                        }
                                    }
                                }, {
                                    $lookup: {
                                        from: 'inventorycars',
                                        localField: '_id',
                                        foreignField: 'inventory',
                                        as: 'cars'
                                    }
                                }, {
                                    $unwind: '$cars'
                                }, {
                                    $match: {
                                        'cars.venue': {
                                            $in: venuesPermissions
                                        },
                                        'cars.status': {
                                            $in: [
                                                inventoryCar_model_1.ChoicesStatusCarInventory.pending,
                                                inventoryCar_model_1.ChoicesStatusCarInventory.found,
                                                inventoryCar_model_1.ChoicesStatusCarInventory.missing,
                                                inventoryCar_model_1.ChoicesStatusCarInventory.leftover,
                                                inventoryCar_model_1.ChoicesStatusCarInventory.reported
                                            ]
                                        }
                                    }
                                }, {
                                    $group: {
                                        _id: {
                                            category: '$_id',
                                            status: '$status',
                                            carStatus: '$cars.status',
                                            name: '$name',
                                            file: '$file',
                                            backup: '$backup',
                                            createdBy: '$createdBy',
                                            createdAt: '$createdAt',
                                            finalizedBy: '$finalizedBy',
                                            finalizedAt: '$finalizedAt'
                                        },
                                        total: {
                                            $sum: 1
                                        }
                                    }
                                }, {
                                    $group: {
                                        _id: '$_id.category',
                                        name: {
                                            $first: '$_id.name'
                                        },
                                        createdAt: {
                                            $first: '$_id.createdAt'
                                        },
                                        file: {
                                            $first: '$_id.file'
                                        },
                                        backup: {
                                            $first: '$_id.backup'
                                        },
                                        finalizedAt: {
                                            $first: '$_id.finalizedAt'
                                        },
                                        createdBy: {
                                            $first: '$_id.createdBy'
                                        },
                                        finalizedBy: {
                                            $first: '$_id.finalizedBy'
                                        },
                                        results: {
                                            $push: {
                                                status: '$_id.carStatus',
                                                total: '$total'
                                            }
                                        },
                                        status: {
                                            $first: '$_id.status'
                                        }
                                    }
                                }, {
                                    $lookup: {
                                        from: 'users',
                                        localField: 'createdBy',
                                        foreignField: '_id',
                                        as: 'createdBy'
                                    }
                                }, {
                                    $lookup: {
                                        from: 'users',
                                        localField: 'finalizedBy',
                                        foreignField: '_id',
                                        as: 'finalizedBy'
                                    }
                                }, {
                                    $project: {
                                        '_id': 1,
                                        'name': 1,
                                        'results': 1,
                                        'file': 1,
                                        'backup': 1,
                                        'createdBy.firstName': 1,
                                        'createdBy.lastName': 1,
                                        'finalizedBy.firstName': 1,
                                        'finalizedBy.lastName': 1,
                                        'status': 1,
                                        'createdAt': 1,
                                        'finalizedAt': 1
                                    }
                                }, {
                                    $sort: {
                                        createdAt: -1
                                    }
                                }])];
                    case 4:
                        inventories = _c.sent();
                        for (_i = 0, inventories_1 = inventories; _i < inventories_1.length; _i++) {
                            inventory = inventories_1[_i];
                            defaultResults = (_b = {},
                                _b[inventoryCar_model_1.ChoicesStatusCarInventory.pending] = 0,
                                _b[inventoryCar_model_1.ChoicesStatusCarInventory.found] = 0,
                                _b[inventoryCar_model_1.ChoicesStatusCarInventory.missing] = 0,
                                _b[inventoryCar_model_1.ChoicesStatusCarInventory.reported] = 0,
                                _b[inventoryCar_model_1.ChoicesStatusCarInventory.leftover] = 0,
                                _b);
                            response.push({
                                _id: inventory._id,
                                name: inventory.name,
                                file: req.user.hasPermission('viewFilesInventory') ? inventory.file : null,
                                backup: req.user.hasPermission('viewFilesInventory') ? inventory.backup : null,
                                createdBy: inventory.createdBy.length ? {
                                    fullName: "".concat(inventory.createdBy[0].firstName, " ").concat(inventory.createdBy[0].lastName)
                                } : {},
                                finalizedBy: inventory.finalizedBy.length ? {
                                    fullName: "".concat(inventory.finalizedBy[0].firstName, " ").concat(inventory.finalizedBy[0].lastName)
                                } : {},
                                results: inventory.results.reduce(function (acc, cur) {
                                    acc[cur.status] = cur.total;
                                    return acc;
                                }, __assign({}, defaultResults)),
                                status: inventory.status,
                                createdAt: inventory.createdAt,
                                finalizedAt: inventory.finalizedAt ? inventory.finalizedAt : null
                            });
                        }
                        return [4 /*yield*/, teamSetting_model_1["default"].findOne({ team: team })];
                    case 5:
                        teamSettings = _c.sent();
                        res.json({
                            inventories: response,
                            inventorySettings: teamSettings.inventory,
                            count: paginatedInventories.total,
                            pages: paginatedInventories.pages,
                            hasPrevious: options.page && options.page > 1 && paginatedInventories.pages && paginatedInventories.pages >= options.page,
                            hasNext: options.page && paginatedInventories.pages && paginatedInventories.pages > options.page,
                            status: 200
                        });
                        _c.label = 6;
                    case 6: return [3 /*break*/, 8];
                    case 7:
                        e_6 = _c.sent();
                        /* istanbul ignore next */
                        logger_service_1["default"].error("list: Async Error.");
                        /* istanbul ignore next */
                        logger_service_1["default"].error("{user: {_id: ".concat(req.user._id, ", email: ").concat(req.user.email, "}}"));
                        /* istanbul ignore next */
                        logger_service_1["default"].error(e_6);
                        /* istanbul ignore next */
                        res.status(500).json({
                            message: e_6,
                            status: 500
                        });
                        return [3 /*break*/, 8];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    InventoryController.prototype.apiDetail = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var team, id, updatedUser, inventory, e_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        team = req.user.team._id;
                        id = req.params.id;
                        logger_service_1["default"].info("apiDetail");
                        logger_service_1["default"].info("{user: {_id: ".concat(req.user._id, ", email: ").concat(req.user.email, "}, inventory: ").concat(id, "}"));
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 6, , 7]);
                        return [4 /*yield*/, user_model_1["default"].findById(req.user._id)];
                    case 2:
                        updatedUser = _a.sent();
                        if (!!updatedUser) return [3 /*break*/, 3];
                        res.status(404).json({
                            message: 'No se ha encontrado el inventario solicitado.',
                            status: 404
                        });
                        return [3 /*break*/, 5];
                    case 3: return [4 /*yield*/, inventory_model_1["default"]
                            .findOne({
                            _id: id,
                            venues: updatedUser.venue,
                            status: {
                                $in: [inventory_model_1.ChoicesStatusInventory.inProcess]
                            },
                            team: team
                        })
                            .populate([{
                                path: 'cars',
                                match: {
                                    status: {
                                        $in: [inventoryCar_model_1.ChoicesStatusCarInventory.pending, inventoryCar_model_1.ChoicesStatusCarInventory.found]
                                    }
                                    //   venue: {
                                    //     $in: venuesPermissions
                                    //   }
                                },
                                populate: [{
                                        path: 'car',
                                        select: ['vin', 'vin2', 'color', 'denomination', 'brand', 'patent']
                                    }, {
                                        path: 'venue',
                                        select: ['name']
                                    }]
                            }]).lean()];
                    case 4:
                        inventory = _a.sent();
                        if (inventory) {
                            res.status(200).json({
                                data: {
                                    cars: inventory.cars
                                        .map(function (car) {
                                        return __assign(__assign({}, car.car), { _id: car._id, venue: car.venue, status: car.status });
                                    }),
                                    reasons: []
                                },
                                status: 200
                            });
                        }
                        else {
                            logger_service_1["default"].error("apiDetail: No se ha encontrado el inventario solicitado.");
                            logger_service_1["default"].error("{user: {_id: ".concat(req.user._id, ", email: ").concat(req.user.email, "}}"));
                            res.status(404).json({
                                message: 'No se ha encontrado el inventario solicitado.',
                                status: 404
                            });
                        }
                        _a.label = 5;
                    case 5: return [3 /*break*/, 7];
                    case 6:
                        e_7 = _a.sent();
                        /* istanbul ignore next */
                        logger_service_1["default"].error("apiDetail: Async Error.");
                        /* istanbul ignore next */
                        logger_service_1["default"].error("{user: {_id: ".concat(req.user._id, ", email: ").concat(req.user.email, "}}"));
                        /* istanbul ignore next */
                        logger_service_1["default"].error(e_7);
                        /* istanbul ignore next */
                        res.status(500).json(e_7);
                        return [3 /*break*/, 7];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    InventoryController.prototype.downloadFile = function (url, dest) {
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
    InventoryController.prototype.uploadFile = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var id, _a, company, venue, team, inventoryCardId, file, inventoryFile, inventoryCar, e_8;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        id = req.params.id;
                        _a = req.user, company = _a.company, venue = _a.venue, team = _a.team;
                        inventoryCardId = req.body.inventoryCardId;
                        logger_service_1["default"].info("uploadFile");
                        logger_service_1["default"].info("{user: {_id: ".concat(req.user._id, ", email: ").concat(req.user.email, "}, inventory: ").concat(id, "}"));
                        file = general_utils_1["default"].getFileFromRequest(req.files, 'file');
                        if (!file) return [3 /*break*/, 15];
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 13, , 14]);
                        inventoryFile = new inventoryFile_model_1["default"]();
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
                        file.team = team._id;
                        file.venue = venue._id;
                        file.inventory = id;
                        inventoryFile.inventory = id;
                        inventoryFile.user = req.user._id;
                        inventoryFile.company = company._id;
                        if (!new RegExp('\\bimage\\b').test(file.mimetype)) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.autoRotate(file.path)];
                    case 2:
                        _b.sent();
                        _b.label = 3;
                    case 3: return [4 /*yield*/, inventoryFile.attach('file', file)];
                    case 4:
                        _b.sent();
                        if (!new RegExp('\\bimage\\b').test(file.mimetype)) return [3 /*break*/, 7];
                        return [4 /*yield*/, this.resizeImage(file.path)];
                    case 5:
                        _b.sent();
                        return [4 /*yield*/, inventoryFile.attach('thumbnail', file)];
                    case 6:
                        _b.sent();
                        _b.label = 7;
                    case 7: return [4 /*yield*/, inventoryFile.save()];
                    case 8:
                        _b.sent();
                        if (!inventoryCardId) return [3 /*break*/, 12];
                        return [4 /*yield*/, inventoryCar_model_1["default"].findById(inventoryCardId)];
                    case 9:
                        inventoryCar = _b.sent();
                        if (!inventoryCar) return [3 /*break*/, 11];
                        return [4 /*yield*/, inventoryCar_model_1["default"].updateOne({
                                _id: inventoryCar._id,
                                inventory: inventoryCar.inventory
                            }, {
                                $push: { files: inventoryFile._id }
                            }, {
                                upsert: true
                            })];
                    case 10:
                        _b.sent();
                        server_1.io.to("inventory-detail-".concat(inventoryCar.inventory)).emit('REFRESH', {
                            update: true,
                            venue: inventoryCar.venue
                        });
                        _b.label = 11;
                    case 11:
                        console.log('**************', inventoryCardId);
                        _b.label = 12;
                    case 12:
                        res.status(201).json({
                            data: {
                                _id: inventoryFile._id,
                                file: inventoryFile.file
                            },
                            status: 201
                        });
                        return [3 /*break*/, 14];
                    case 13:
                        e_8 = _b.sent();
                        /* istanbul ignore next */
                        logger_service_1["default"].error("uploadFile: Async Error.");
                        /* istanbul ignore next */
                        logger_service_1["default"].error("{user: {_id: ".concat(req.user._id, ", email: ").concat(req.user.email, "}}"));
                        /* istanbul ignore next */
                        logger_service_1["default"].error(e_8);
                        /* istanbul ignore next */
                        res.status(400).json(e_8);
                        return [3 /*break*/, 14];
                    case 14: return [3 /*break*/, 16];
                    case 15:
                        logger_service_1["default"].error("uploadFile: La imagen es obligatoria.");
                        logger_service_1["default"].error("{user: {_id: ".concat(req.user._id, ", email: ").concat(req.user.email, "}}"));
                        /* istanbul ignore next */
                        res.status(400).json({
                            message: 'La imagen es obligatoria.',
                            status: 400
                        });
                        _b.label = 16;
                    case 16: return [2 /*return*/];
                }
            });
        });
    };
    InventoryController.prototype.removeInventoryCarFile = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var id, inventoryFile, e_9;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        id = req.params.id;
                        return [4 /*yield*/, inventoryFile_model_2["default"].findOneAndRemove({ _id: id })];
                    case 1:
                        inventoryFile = _a.sent();
                        if (inventoryFile) {
                            server_1.io.to("inventory-detail-".concat(inventoryFile.inventory)).emit('REFRESH', {
                                update: true,
                                venue: req.user.venue._id
                            });
                        }
                        res.json({});
                        return [3 /*break*/, 3];
                    case 2:
                        e_9 = _a.sent();
                        logger_service_1["default"].error("removeInventoryCarFile: La imagen es obligatoria.");
                        logger_service_1["default"].error("{user: {_id: ".concat(req.user._id, ", email: ").concat(req.user.email, "}}"));
                        /* istanbul ignore next */
                        res.status(400).json({
                            message: 'La imagen es obligatoria.',
                            status: 400
                        });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    InventoryController.prototype.apiFoundCar = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var team, id, _a, vin, images, updatedUser, teamSettings, venueId, inventory, car, inventoriedCar, inventoryCar, e_10;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        team = req.user.team;
                        id = req.params.id;
                        _a = req.body, vin = _a.vin, images = _a.images;
                        logger_service_1["default"].info("apiFoundCar");
                        logger_service_1["default"].info("{user: {_id: ".concat(req.user._id, ", email: ").concat(req.user.email, "}, body: ").concat(JSON.stringify(req.body), "}"));
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 16, , 17]);
                        return [4 /*yield*/, user_model_1["default"].findById(req.user._id).populate([{
                                    path: 'venue',
                                    select: ['name']
                                }])];
                    case 2:
                        updatedUser = _b.sent();
                        return [4 /*yield*/, teamSetting_model_1["default"].findOne({ team: team })];
                    case 3:
                        teamSettings = _b.sent();
                        if (!updatedUser) {
                            return [2 /*return*/, res.status(404).json({
                                    message: 'No se ha encontrado el inventario solicitado.',
                                    status: 404
                                })];
                        }
                        venueId = updatedUser.venue._id;
                        return [4 /*yield*/, inventory_model_1["default"].findOne({
                                _id: id,
                                team: team,
                                status: inventory_model_1.ChoicesStatusInventory.inProcess
                            })];
                    case 4:
                        inventory = _b.sent();
                        if (!inventory) return [3 /*break*/, 14];
                        return [4 /*yield*/, car_model_1["default"].findOne({
                                vin: vin,
                                team: team
                            })];
                    case 5:
                        car = _b.sent();
                        if (!car) return [3 /*break*/, 12];
                        return [4 /*yield*/, inventoryCar_model_1["default"].findOne({
                                inventory: id,
                                car: car._id,
                                status: {
                                    $in: [inventoryCar_model_1.ChoicesStatusCarInventory.found, inventoryCar_model_1.ChoicesStatusCarInventory.leftover]
                                }
                            })];
                    case 6:
                        inventoriedCar = _b.sent();
                        if (!inventoriedCar) return [3 /*break*/, 7];
                        logger_service_1["default"].error("apiFoundCar: Este veh\u00EDculo ya ha sido inventariado");
                        logger_service_1["default"].error("{user: {_id: ".concat(req.user._id, ", email: ").concat(req.user.email, "}}"));
                        res.status(200).json({
                            message: 'Este vehículo ya ha sido inventariado',
                            status: 200
                        });
                        return [3 /*break*/, 11];
                    case 7: return [4 /*yield*/, inventoryCar_model_1["default"].findOne({
                            inventory: id,
                            car: car._id
                        })];
                    case 8:
                        inventoryCar = _b.sent();
                        if (!inventoryCar) return [3 /*break*/, 10];
                        inventoryCar.venueFound = venueId;
                        if (teamSettings.inventory.leftoverDifferentVenue && inventoryCar.venue.toString() !== venueId.toString()) {
                            inventoryCar.status = inventoryCar_model_1.ChoicesStatusCarInventory.leftover;
                            server_1.io.to("inventory-detail-".concat(inventory._id)).emit('REFRESH', {
                                title: 'Vehículo encontrado',
                                text: "".concat(req.user.firstName, " ").concat(req.user.lastName, " encontr\u00F3 ").concat(car.brand, " (").concat(car.denomination, ") en ").concat(updatedUser.venue.name, "."),
                                status: inventoryCar_model_1.ChoicesStatusCarInventory.leftover,
                                venue: venueId,
                                update: true
                            });
                        }
                        else {
                            inventoryCar.status = inventoryCar_model_1.ChoicesStatusCarInventory.found;
                            server_1.io.to("inventory-detail-".concat(inventory._id)).emit('REFRESH', {
                                title: 'Vehículo encontrado',
                                text: "".concat(req.user.firstName, " ").concat(req.user.lastName, " encontr\u00F3 ").concat(car.brand, " (").concat(car.denomination, ") en ").concat(updatedUser.venue.name, "."),
                                status: inventoryCar_model_1.ChoicesStatusCarInventory.found,
                                venue: venueId,
                                update: true
                            });
                        }
                        inventoryCar.images = images ? images.map(function (image) { return (new bson_1.ObjectID(image)); }) : [];
                        inventoryCar.inventoriedBy = req.user._id;
                        return [4 /*yield*/, inventoryCar.save()];
                    case 9:
                        _b.sent();
                        server_1.io.to("inventory-list-".concat(team._id)).emit('REFRESH', {
                            update: true
                        });
                        res.status(200).json({
                            vin: car.vin,
                            status: 200
                        });
                        return [3 /*break*/, 11];
                    case 10:
                        logger_service_1["default"].error("apiFoundCar: Este veh\u00EDculo no se encuentra en el inventario.");
                        logger_service_1["default"].error("{user: {_id: ".concat(req.user._id, ", email: ").concat(req.user.email, "}}"));
                        res.status(400).json({
                            message: 'Este vehículo no se encuentra en el inventario.',
                            status: 400
                        });
                        _b.label = 11;
                    case 11: return [3 /*break*/, 13];
                    case 12:
                        // if car no exist
                        logger_service_1["default"].error("apiFoundCar: Este veh\u00EDculo no se encuentra en el inventario.");
                        logger_service_1["default"].error("{user: {_id: ".concat(req.user._id, ", email: ").concat(req.user.email, "}}"));
                        res.status(400).json({
                            message: 'Este vehículo no se encuentra en el inventario.',
                            status: 400
                        });
                        _b.label = 13;
                    case 13: return [3 /*break*/, 15];
                    case 14:
                        // if inventory no exist
                        logger_service_1["default"].error("apiFoundCar: Este inventario no existe o ya no se encuentra activo.");
                        logger_service_1["default"].error("{user: {_id: ".concat(req.user._id, ", email: ").concat(req.user.email, "}}"));
                        res.status(404).json({
                            message: 'Este inventario no existe o ya no se encuentra activo.',
                            status: 404
                        });
                        _b.label = 15;
                    case 15: return [3 /*break*/, 17];
                    case 16:
                        e_10 = _b.sent();
                        /* istanbul ignore next */
                        logger_service_1["default"].error("apiFoundCar: Async Error.");
                        /* istanbul ignore next */
                        logger_service_1["default"].error("{user: {_id: ".concat(req.user._id, ", email: ").concat(req.user.email, "}, error: ").concat(e_10, "}"));
                        /* istanbul ignore next */
                        logger_service_1["default"].error(e_10);
                        /* istanbul ignore next */
                        res.status(400).json({
                            message: e_10,
                            status: 400
                        });
                        return [3 /*break*/, 17];
                    case 17: return [2 /*return*/];
                }
            });
        });
    };
    InventoryController.prototype.finishInventory = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var team, id, inventory, e_11;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        team = req.user.team._id;
                        id = req.params.id;
                        if (!req.user.hasPermission('finishInventory')) {
                            return [2 /*return*/, res.status(403).json({
                                    message: 'No tienes permisos para esta operación'
                                })];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 6, , 7]);
                        return [4 /*yield*/, inventory_model_1["default"].findOne({ _id: id, team: team })];
                    case 2:
                        inventory = _a.sent();
                        if (!inventory) return [3 /*break*/, 4];
                        return [4 /*yield*/, inventory.update({
                                status: inventory_model_1.ChoicesStatusInventory.finalized,
                                finalizedAt: new Date(),
                                finalizedBy: req.user._id
                            })];
                    case 3:
                        _a.sent();
                        server_1.io.to("inventory-list-".concat(team)).emit('REFRESH', {
                            update: true
                        });
                        server_1.io.to("stock-".concat(team)).emit('REFRESH', {
                            update: true
                        });
                        res.json({
                            message: 'Se ha finalizado correctamente el inventario.',
                            status: 200
                        });
                        return [3 /*break*/, 5];
                    case 4:
                        logger_service_1["default"].error("finishInventory: No se ha encontrado el inventario");
                        logger_service_1["default"].error("{user: {_id: ".concat(req.user._id, ", email: ").concat(req.user.email, "}}"));
                        res.status(400).json({
                            message: 'No se ha encontrado el inventario',
                            status: 400
                        });
                        _a.label = 5;
                    case 5: return [3 /*break*/, 7];
                    case 6:
                        e_11 = _a.sent();
                        /* istanbul ignore next */
                        logger_service_1["default"].error("finishInventory: Async Error.");
                        /* istanbul ignore next */
                        logger_service_1["default"].error("{user: {_id: ".concat(req.user._id, ", email: ").concat(req.user.email, "}}"));
                        /* istanbul ignore next */
                        logger_service_1["default"].error(e_11);
                        /* istanbul ignore next */
                        res.status(400).json({
                            message: 'Ha ocurrido un error',
                            status: 400
                        });
                        return [3 /*break*/, 7];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    InventoryController.prototype.deleteInventory = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var team, id, inventory, e_12;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        team = req.user.team._id;
                        id = req.params.id;
                        if (!req.user.hasPermission('deleteInventory')) {
                            return [2 /*return*/, res.status(403).json({
                                    message: 'No tienes permisos para esta operación'
                                })];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 7, , 8]);
                        return [4 /*yield*/, inventory_model_1["default"].findOne({
                                _id: id,
                                team: team
                            })];
                    case 2:
                        inventory = _a.sent();
                        if (!inventory) return [3 /*break*/, 5];
                        return [4 /*yield*/, inventoryCar_model_1["default"].find({ inventory: inventory }).remove()];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, inventory.remove()];
                    case 4:
                        _a.sent();
                        server_1.io.to("inventory-list-".concat(team)).emit('REFRESH', {
                            update: true
                        });
                        server_1.io.to("stock-".concat(team)).emit('REFRESH', {
                            update: true
                        });
                        res.json({
                            message: 'Se ha eliminado correctamente el inventario.',
                            status: 200
                        });
                        return [3 /*break*/, 6];
                    case 5:
                        logger_service_1["default"].error("deleteInventory: No se ha encontrado el inventario");
                        logger_service_1["default"].error("{user: {_id: ".concat(req.user._id, ", email: ").concat(req.user.email, "}}"));
                        res.status(400).json({
                            message: 'No se ha encontrado el inventario',
                            status: 400
                        });
                        _a.label = 6;
                    case 6: return [3 /*break*/, 8];
                    case 7:
                        e_12 = _a.sent();
                        /* istanbul ignore next */
                        logger_service_1["default"].error("deleteInventory: Async Error.");
                        /* istanbul ignore next */
                        logger_service_1["default"].error("{user: {_id: ".concat(req.user._id, ", email: ").concat(req.user.email, "}}"));
                        /* istanbul ignore next */
                        logger_service_1["default"].error(e_12);
                        /* istanbul ignore next */
                        res.status(400).json({
                            message: 'Ha ocurrido un error',
                            status: 400
                        });
                        return [3 /*break*/, 8];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    InventoryController.prototype.addComment = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var inventory, _a, _id, comment, e_13;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        inventory = req.params.inventory;
                        _a = req.body, _id = _a._id, comment = _a.comment;
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, inventoryCar_model_1["default"].update({
                                inventory: inventory,
                                _id: _id
                            }, {
                                $push: {
                                    comments: {
                                        user: req.user._id,
                                        comment: comment,
                                        createdAt: new Date()
                                    }
                                }
                            }, {
                                upsert: true
                            })];
                    case 2:
                        _b.sent();
                        server_1.io.to("inventory-detail-".concat(inventory)).emit('REFRESH', {
                            update: true
                        });
                        server_1.io.to("inventory-comment-".concat(_id)).emit('NEW_COMMENT', {
                            _id: new bson_1.ObjectID(),
                            user: {
                                _id: req.user._id,
                                firstName: req.user.firstName,
                                lastName: req.user.lastName
                            },
                            comment: comment
                        });
                        res.status(200).json({
                            message: 'Comentario agregado satisfactoriamente.',
                            status: 200
                        });
                        return [3 /*break*/, 4];
                    case 3:
                        e_13 = _b.sent();
                        /* istanbul ignore next */
                        logger_service_1["default"].error("addComment: Async Error.");
                        /* istanbul ignore next */
                        logger_service_1["default"].error("{user: {_id: ".concat(req.user._id, ", email: ").concat(req.user.email, "}}"));
                        /* istanbul ignore next */
                        logger_service_1["default"].error(e_13);
                        /* istanbul ignore next */
                        res.status(400).json({
                            message: 'Ha ocurrido un error',
                            status: 400
                        });
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    InventoryController.prototype.downloadImages = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var id, cars, team, inventory, inventoriesCars, archive_1, filename_1, imagesToDownload, imagesToCompress, _i, inventoriesCars_1, car, _loop_1, _a, _b, image, results, numb, _c, e_14;
            var _this = this;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        id = req.params.id;
                        cars = req.body.cars;
                        team = req.user.team._id;
                        _d.label = 1;
                    case 1:
                        _d.trys.push([1, 9, , 10]);
                        return [4 /*yield*/, inventory_model_1["default"].findOne({
                                _id: id,
                                team: team
                            }, {
                                name: true
                            })];
                    case 2:
                        inventory = _d.sent();
                        if (!inventory) return [3 /*break*/, 7];
                        return [4 /*yield*/, inventory_model_1["default"].aggregate([{
                                    $match: {
                                        team: team,
                                        _id: mongoose.Types.ObjectId(id)
                                    }
                                }, {
                                    $lookup: {
                                        from: 'inventorycars',
                                        localField: '_id',
                                        foreignField: 'inventory',
                                        as: 'cars'
                                    }
                                }, {
                                    $project: {
                                        cars: {
                                            $filter: {
                                                input: '$cars',
                                                as: 'cars',
                                                cond: {
                                                    $and: [
                                                        {
                                                            $in: ['$$cars._id', cars.map(function (car) { return mongoose.Types.ObjectId(car); })]
                                                        }, {
                                                            $ne: ['$$cars.images', []]
                                                        }
                                                    ]
                                                }
                                            }
                                        }
                                    }
                                }, {
                                    $unwind: '$cars'
                                }, {
                                    $replaceRoot: {
                                        newRoot: '$cars'
                                    }
                                }, {
                                    $lookup: {
                                        from: 'inventoryfiles',
                                        localField: 'images',
                                        foreignField: '_id',
                                        as: 'images'
                                    }
                                }, {
                                    $lookup: {
                                        from: 'cars',
                                        localField: 'car',
                                        foreignField: '_id',
                                        as: 'car'
                                    }
                                }, {
                                    $unwind: '$car'
                                }, {
                                    $lookup: {
                                        from: 'venues',
                                        localField: 'venue',
                                        foreignField: '_id',
                                        as: 'venue'
                                    }
                                }, {
                                    $unwind: '$venue'
                                }, {
                                    $project: {
                                        images: 1,
                                        venue: 1,
                                        car: 1
                                    }
                                }])];
                    case 3:
                        inventoriesCars = _d.sent();
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
                        filename_1 = "".concat(inventory.name, ".zip");
                        archive_1.on('end', function () {
                            console.log("".concat(filename_1, ": Archive wrote ").concat((archive_1.pointer() / (1024 * 1024)).toFixed(2), "MB"));
                        });
                        res.attachment(filename_1);
                        imagesToDownload = [];
                        imagesToCompress = [];
                        for (_i = 0, inventoriesCars_1 = inventoriesCars; _i < inventoriesCars_1.length; _i++) {
                            car = inventoriesCars_1[_i];
                            _loop_1 = function (image) {
                                var destDirectory = "/tmp/".concat(car._id).concat(image._id, ".").concat(image.file.name.split('.')[image.file.name.split('.').length - 1]);
                                imagesToDownload.push(function () { return _this.downloadFile(image.file.url, destDirectory); });
                                imagesToCompress.push({
                                    destDirectory: destDirectory,
                                    name: "".concat(car.car.vin, "/IMAGE").concat(image._id.toString().substr(image._id.length - 10, 10).toUpperCase(), ".").concat(image.file.name.split('.')[image.file.name.split('.').length - 1])
                                });
                            };
                            for (_a = 0, _b = car.images; _a < _b.length; _a++) {
                                image = _b[_a];
                                _loop_1(image);
                            }
                        }
                        // download images
                        console.log('EXECUTE PROMISES');
                        results = [];
                        numb = 1;
                        _d.label = 4;
                    case 4:
                        if (!imagesToDownload.length) return [3 /*break*/, 6];
                        console.log('promise', numb);
                        _c = [__spreadArray([], results, true)];
                        return [4 /*yield*/, bluebird.all(imagesToDownload.splice(0, 20).map(function (promise) { return promise(); }))];
                    case 5:
                        results = __spreadArray.apply(void 0, _c.concat([_d.sent(), true]));
                        numb++;
                        return [3 /*break*/, 4];
                    case 6:
                        // compress images
                        console.log('EXECUTE COMPRESS');
                        imagesToCompress.map(function (image) {
                            archive_1.file(image.destDirectory, {
                                name: image.name
                            });
                            setTimeout(function () {
                                if (fs.existsSync(image.destDirectory)) {
                                    console.log("clear ".concat(image.destDirectory));
                                    fs.unlink(image.destDirectory, function (err) {
                                        if (err) {
                                            console.log(err);
                                        }
                                    });
                                }
                            }, 7200000);
                        });
                        res.setHeader('size', results.reduce(function (a, b) { return a + b; }));
                        archive_1.pipe(res);
                        archive_1.finalize();
                        return [3 /*break*/, 8];
                    case 7:
                        logger_service_1["default"].error("downloadImages: 'No se ha encontrado el inventario.");
                        logger_service_1["default"].error("{user: {_id: ".concat(req.user._id, ", email: ").concat(req.user.email, "}}"));
                        res.status(404).json({
                            message: 'No se ha encontrado el inventario.',
                            status: 404
                        });
                        _d.label = 8;
                    case 8: return [3 /*break*/, 10];
                    case 9:
                        e_14 = _d.sent();
                        /* istanbul ignore next */
                        logger_service_1["default"].error("downloadImages: Async Error.");
                        /* istanbul ignore next */
                        logger_service_1["default"].error("{user: {_id: ".concat(req.user._id, ", email: ").concat(req.user.email, "}}"));
                        /* istanbul ignore next */
                        logger_service_1["default"].error(e_14);
                        /* istanbul ignore next */
                        res.status(400).json({
                            message: e_14,
                            status: 400
                        });
                        return [3 /*break*/, 10];
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    InventoryController.prototype.reportCar = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, company, team, id, _b, vin, patent, denomination, brand, color, images, updatedUser, venueId, inventory, findCOnditions, isVinAvailable, car, inventoryCar, textNotification, e_15;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _a = req.user, company = _a.company, team = _a.team;
                        id = req.params.id;
                        _b = req.body, vin = _b.vin, patent = _b.patent, denomination = _b.denomination, brand = _b.brand, color = _b.color, images = _b.images;
                        logger_service_1["default"].info("reportCar");
                        logger_service_1["default"].info("{user: {_id: ".concat(req.user._id, ", email: ").concat(req.user.email, "}, body: ").concat(JSON.stringify(req.body), "}"));
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 8, , 9]);
                        return [4 /*yield*/, user_model_1["default"].findById(req.user._id).populate([{
                                    path: 'venue',
                                    select: ['name']
                                }])];
                    case 2:
                        updatedUser = _c.sent();
                        if (!updatedUser) {
                            return [2 /*return*/, res.status(404).json({
                                    message: 'No se ha encontrado el inventario solicitado.',
                                    status: 404
                                })];
                        }
                        venueId = updatedUser.venue._id;
                        return [4 /*yield*/, inventory_model_1["default"].findOne({
                                _id: id,
                                status: inventory_model_1.ChoicesStatusInventory.inProcess,
                                team: team
                            })];
                    case 3:
                        inventory = _c.sent();
                        findCOnditions = {};
                        isVinAvailable = vin && vin.length > 0;
                        if (vin)
                            findCOnditions = { vin: vin, team: team };
                        if (!isVinAvailable && patent && patent.length > 0)
                            findCOnditions = { patent: patent, team: team };
                        if (!inventory) return [3 /*break*/, 6];
                        return [4 /*yield*/, car_model_1["default"].findOneOrCreate(findCOnditions, {
                                vin: vin,
                                vin2: vin.substr(vin.length - 6),
                                patent: patent,
                                brand: brand,
                                denomination: denomination,
                                color: color,
                                team: team,
                                company: company,
                                createdBy: req.user,
                                status: car_model_1.ChoicesStatusCar.inventory
                            })];
                    case 4:
                        car = _c.sent();
                        inventoryCar = new inventoryCar_model_1["default"]({
                            car: car,
                            inventory: inventory,
                            venue: venueId,
                            venueFound: venueId,
                            comments: [],
                            inventoriedBy: req.user._id,
                            images: images ? images.map(function (image) { return (new bson_1.ObjectID(image)); }) : [],
                            status: inventoryCar_model_1.ChoicesStatusCarInventory.reported
                        });
                        return [4 /*yield*/, inventoryCar.save()];
                    case 5:
                        _c.sent();
                        textNotification = "".concat(req.user.firstName, " ").concat(req.user.lastName, " encontr\u00F3 ").concat(car.brand, " (").concat(car.denomination, ") en ").concat(updatedUser.venue.name, ".");
                        server_1.io.to("inventory-detail-".concat(inventory._id)).emit('REFRESH', {
                            title: 'Vehículo reportado',
                            text: textNotification,
                            status: inventoryCar_model_1.ChoicesStatusCarInventory.reported,
                            venue: venueId,
                            update: true
                        });
                        server_1.io.to("inventory-list-".concat(team._id)).emit('REFRESH', {
                            update: true
                        });
                        res.json({
                            message: 'Se ha generado el reporte correctamente.',
                            vin: vin,
                            status: 200
                        });
                        return [3 /*break*/, 7];
                    case 6:
                        logger_service_1["default"].error("reportCar: Este inventario ya no se encuentra disponible.");
                        logger_service_1["default"].error("{user: {_id: ".concat(req.user._id, ", email: ").concat(req.user.email, "}}"));
                        res.status(404).json({
                            message: 'Este inventario ya no se encuentra disponible.',
                            status: 404
                        });
                        _c.label = 7;
                    case 7: return [3 /*break*/, 9];
                    case 8:
                        e_15 = _c.sent();
                        /* istanbul ignore next */
                        logger_service_1["default"].error("reportCar: Async Error.");
                        /* istanbul ignore next */
                        logger_service_1["default"].error("{user: {_id: ".concat(req.user._id, ", email: ").concat(req.user.email, "}}"));
                        /* istanbul ignore next */
                        logger_service_1["default"].error(e_15);
                        /* istanbul ignore next */
                        res.status(400).json({
                            message: e_15,
                            status: 400
                        });
                        return [3 /*break*/, 9];
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    InventoryController.prototype.setLabel = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var team, id, _a, car, label, custom, carID, inventoryCar, newLabel, inventoryCar, e_16;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        team = req.user.team._id;
                        id = req.params.id;
                        _a = req.body, car = _a.car, label = _a.label, custom = _a.custom, carID = _a.carID;
                        logger_service_1["default"].info("setLabel");
                        logger_service_1["default"].info("{user: {_id: ".concat(req.user._id, ", email: ").concat(req.user.email, "}, body: ").concat(JSON.stringify(req.body), ", params: ").concat(JSON.stringify(req.params), "}"));
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 12, , 13]);
                        if (!(label === 'deleted')) return [3 /*break*/, 5];
                        return [4 /*yield*/, inventoryCar_model_1["default"].findById(car, { venue: true })];
                    case 2:
                        inventoryCar = _b.sent();
                        if (!inventoryCar) return [3 /*break*/, 4];
                        return [4 /*yield*/, inventoryCar_model_1["default"].update({
                                _id: car,
                                inventory: id
                            }, {
                                status: inventoryCar_model_1.ChoicesStatusCarInventory.deleted,
                                deletedBy: req.user._id
                            }, {
                                upsert: true
                            })];
                    case 3:
                        _b.sent();
                        server_1.io.to("inventory-detail-".concat(id)).emit('REFRESH', {
                            update: true,
                            venue: inventoryCar.venue
                        });
                        server_1.io.to("inventory-list-".concat(team)).emit('REFRESH', {
                            update: true
                        });
                        _b.label = 4;
                    case 4:
                        res.json({
                            message: 'Opción procesada correctamente.',
                            status: 200
                        });
                        return [3 /*break*/, 11];
                    case 5: return [4 /*yield*/, inventoryLabel_model_1["default"].findOne({
                            _id: label,
                            team: team
                        })];
                    case 6:
                        newLabel = _b.sent();
                        if (!newLabel) return [3 /*break*/, 11];
                        return [4 /*yield*/, inventoryCar_model_1["default"].findById(car, { venue: true })];
                    case 7:
                        inventoryCar = _b.sent();
                        if (!inventoryCar) return [3 /*break*/, 11];
                        return [4 /*yield*/, inventoryCar_model_1["default"].update({
                                _id: car,
                                inventory: id
                            }, {
                                status: newLabel.sendTo,
                                label: newLabel._id,
                                labelBy: req.user._id,
                                labelText: custom
                            }, {
                                upsert: true
                            })];
                    case 8:
                        _b.sent();
                        if (!newLabel.isExhibition) return [3 /*break*/, 10];
                        return [4 /*yield*/, car_model_1["default"].findOneAndUpdate({
                                _id: carID,
                                team: team
                            }, {
                                isExhibition: true
                            })];
                    case 9:
                        _b.sent();
                        _b.label = 10;
                    case 10:
                        server_1.io.to("inventory-detail-".concat(id)).emit('REFRESH', {
                            update: true,
                            venue: inventoryCar.venue
                        });
                        server_1.io.to("inventory-list-".concat(team)).emit('REFRESH', {
                            update: true
                        });
                        res.json({
                            message: 'Opción procesada correctamente.',
                            status: 200
                        });
                        _b.label = 11;
                    case 11: return [3 /*break*/, 13];
                    case 12:
                        e_16 = _b.sent();
                        /* istanbul ignore next */
                        logger_service_1["default"].error("setLabel: Async Error.");
                        /* istanbul ignore next */
                        logger_service_1["default"].error("{user: {_id: ".concat(req.user._id, ", email: ").concat(req.user.email, "}}"));
                        /* istanbul ignore next */
                        logger_service_1["default"].error(e_16);
                        /* istanbul ignore next */
                        res.status(500).json({
                            message: e_16,
                            status: 500
                        });
                        return [3 /*break*/, 13];
                    case 13: return [2 /*return*/];
                }
            });
        });
    };
    InventoryController.prototype.apiList = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var team, updatedUser, inventories, e_17;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 5, , 6]);
                        team = req.user.team._id;
                        logger_service_1["default"].info("apiList");
                        logger_service_1["default"].info("{user: {_id: ".concat(req.user._id, ", email: ").concat(req.user.email, "}}"));
                        return [4 /*yield*/, user_model_1["default"].findById(req.user._id)];
                    case 1:
                        updatedUser = _a.sent();
                        if (!updatedUser) return [3 /*break*/, 3];
                        return [4 /*yield*/, inventory_model_1["default"].find({
                                team: team,
                                venues: updatedUser.venue,
                                status: {
                                    $in: [inventory_model_1.ChoicesStatusInventory.inProcess]
                                }
                            }, {
                                _id: true,
                                name: true,
                                settings: true
                            }).lean()];
                    case 2:
                        inventories = _a.sent();
                        res.json({
                            data: inventories,
                            status: 200
                        });
                        return [3 /*break*/, 4];
                    case 3:
                        logger_service_1["default"].error("apiList: Usuario no encontrado");
                        logger_service_1["default"].error("{user: {_id: ".concat(req.user._id, ", email: ").concat(req.user.email, "}}"));
                        /* istanbul ignore next */
                        res.status(400).json({
                            message: 'Usuario no encontrado',
                            status: 400
                        });
                        _a.label = 4;
                    case 4: return [3 /*break*/, 6];
                    case 5:
                        e_17 = _a.sent();
                        /* istanbul ignore next */
                        logger_service_1["default"].error("apiList: Async Error.");
                        /* istanbul ignore next */
                        logger_service_1["default"].error("{user: {_id: ".concat(req.user._id, ", email: ").concat(req.user.email, "}}"));
                        /* istanbul ignore next */
                        logger_service_1["default"].error(e_17);
                        /* istanbul ignore next */
                        res.status(400).json({
                            message: e_17,
                            status: 400
                        });
                        return [3 /*break*/, 6];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    InventoryController.prototype.detaill = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var id, team, venuesPermissions, inventory, detailByVenues, detailByBrands, detailByBrand, detailByVenue, defaultResults, _i, detailByBrands_1, db, _a, detailByVenues_1, dv, currentInventory, response, detailInventory, teamSettings, labels, e_18;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 9, , 10]);
                        id = req.params.id;
                        team = req.user.team._id;
                        venuesPermissions = req.user.venuesPermissions();
                        return [4 /*yield*/, inventory_model_1["default"].aggregate([
                                {
                                    $match: {
                                        team: team,
                                        _id: { $in: [mongoose.Types.ObjectId(id)] }
                                    }
                                }, {
                                    $lookup: {
                                        from: 'inventorycars',
                                        localField: '_id',
                                        foreignField: 'inventory',
                                        as: 'cars'
                                    }
                                }, {
                                    $unwind: { path: '$cars', preserveNullAndEmptyArrays: true }
                                }, {
                                    $match: {
                                        $or: [
                                            {
                                                'cars.venue': {
                                                    $in: venuesPermissions
                                                }
                                            }, {
                                                'cars.venueFound': {
                                                    $in: venuesPermissions
                                                }
                                            }
                                        ],
                                        'cars.status': {
                                            $in: [
                                                inventoryCar_model_1.ChoicesStatusCarInventory.pending,
                                                inventoryCar_model_1.ChoicesStatusCarInventory.found,
                                                inventoryCar_model_1.ChoicesStatusCarInventory.missing,
                                                inventoryCar_model_1.ChoicesStatusCarInventory.leftover,
                                                inventoryCar_model_1.ChoicesStatusCarInventory.reported
                                            ]
                                        }
                                    }
                                }, {
                                    $group: {
                                        _id: {
                                            category: '$_id',
                                            status: '$status',
                                            carStatus: '$cars.status',
                                            name: '$name',
                                            createdBy: '$createdBy',
                                            createdAt: '$createdAt',
                                            finalizedAt: '$finalizedAt'
                                        },
                                        total: {
                                            $sum: 1
                                        }
                                    }
                                }, {
                                    $group: {
                                        _id: '$_id.category',
                                        name: {
                                            $first: '$_id.name'
                                        },
                                        createdAt: {
                                            $first: '$_id.createdAt'
                                        },
                                        finalizedAt: {
                                            $first: '$_id.finalizedAt'
                                        },
                                        user: {
                                            $first: '$_id.createdBy'
                                        },
                                        results: {
                                            $push: {
                                                status: '$_id.carStatus',
                                                total: '$total'
                                            }
                                        },
                                        status: {
                                            $first: '$_id.status'
                                        }
                                    }
                                }, {
                                    $lookup: {
                                        from: 'users',
                                        localField: 'user',
                                        foreignField: '_id',
                                        as: 'userInfo'
                                    }
                                }, {
                                    $unwind: { path: '$userInfo', preserveNullAndEmptyArrays: true }
                                }, {
                                    $project: {
                                        '_id': 1,
                                        'name': 1,
                                        'results': 1,
                                        'userInfo.firstName': 1,
                                        'userInfo.lastName': 1,
                                        'status': 1,
                                        'createdAt': 1,
                                        'finalizedAt': 1
                                    }
                                }, {
                                    $sort: {
                                        createdAt: -1
                                    }
                                }
                            ])];
                    case 1:
                        inventory = _c.sent();
                        return [4 /*yield*/, inventory_model_1["default"].aggregate([
                                {
                                    $match: {
                                        team: team,
                                        _id: { $in: [mongoose.Types.ObjectId(id)] }
                                    }
                                }, {
                                    $lookup: {
                                        from: 'inventorycars',
                                        localField: '_id',
                                        foreignField: 'inventory',
                                        as: 'cars'
                                    }
                                }, {
                                    $unwind: '$cars'
                                }, {
                                    $match: {
                                        $or: [
                                            {
                                                'cars.venue': {
                                                    $in: venuesPermissions
                                                }
                                            }, {
                                                'cars.venueFound': {
                                                    $in: venuesPermissions
                                                }
                                            }
                                        ],
                                        'cars.status': {
                                            $in: [
                                                inventoryCar_model_1.ChoicesStatusCarInventory.pending,
                                                inventoryCar_model_1.ChoicesStatusCarInventory.found,
                                                inventoryCar_model_1.ChoicesStatusCarInventory.missing,
                                                inventoryCar_model_1.ChoicesStatusCarInventory.leftover,
                                                inventoryCar_model_1.ChoicesStatusCarInventory.reported
                                            ]
                                        }
                                    }
                                }, {
                                    $group: {
                                        _id: {
                                            category: {
                                                $cond: {
                                                    "if": {
                                                        $gt: ['$cars.venueFound', null]
                                                    },
                                                    then: '$cars.venueFound',
                                                    "else": '$cars.venue'
                                                }
                                            },
                                            status: '$cars.status'
                                        },
                                        total: {
                                            $sum: 1
                                        }
                                    }
                                }, {
                                    $group: {
                                        _id: '$_id.category',
                                        status: {
                                            $push: {
                                                name: '$_id.status',
                                                total: '$total'
                                            }
                                        }
                                    }
                                }, {
                                    $lookup: {
                                        from: 'venues',
                                        localField: '_id',
                                        foreignField: '_id',
                                        as: 'info'
                                    }
                                }, {
                                    $unwind: '$info'
                                }
                            ])];
                    case 2:
                        detailByVenues = _c.sent();
                        return [4 /*yield*/, inventory_model_1["default"].aggregate([
                                {
                                    $match: {
                                        team: team,
                                        _id: { $in: [mongoose.Types.ObjectId(id)] }
                                    }
                                }, {
                                    $lookup: {
                                        from: 'inventorycars',
                                        localField: '_id',
                                        foreignField: 'inventory',
                                        as: 'cars'
                                    }
                                }, {
                                    $unwind: '$cars'
                                }, {
                                    $match: {
                                        $or: [
                                            {
                                                'cars.venue': {
                                                    $in: venuesPermissions
                                                }
                                            }, {
                                                'cars.venueFound': {
                                                    $in: venuesPermissions
                                                }
                                            }
                                        ],
                                        'cars.status': {
                                            $in: [
                                                inventoryCar_model_1.ChoicesStatusCarInventory.pending,
                                                inventoryCar_model_1.ChoicesStatusCarInventory.found,
                                                inventoryCar_model_1.ChoicesStatusCarInventory.missing,
                                                inventoryCar_model_1.ChoicesStatusCarInventory.leftover,
                                                inventoryCar_model_1.ChoicesStatusCarInventory.reported
                                            ]
                                        }
                                    }
                                }, {
                                    $lookup: {
                                        from: 'cars',
                                        localField: 'cars.car',
                                        foreignField: '_id',
                                        as: 'car'
                                    }
                                }, {
                                    $unwind: '$car'
                                }, {
                                    $group: {
                                        _id: {
                                            car: '$car.brand',
                                            status: '$cars.status'
                                        },
                                        total: {
                                            $sum: 1
                                        }
                                    }
                                }, {
                                    $group: {
                                        _id: '$_id.car',
                                        status: {
                                            $push: {
                                                name: '$_id.status',
                                                total: '$total'
                                            }
                                        }
                                    }
                                }, {
                                    $lookup: {
                                        from: 'venues',
                                        localField: '_id',
                                        foreignField: '_id',
                                        as: 'info'
                                    }
                                }
                            ])];
                    case 3:
                        detailByBrands = _c.sent();
                        detailByBrand = [];
                        detailByVenue = [];
                        defaultResults = (_b = {},
                            _b[inventoryCar_model_1.ChoicesStatusCarInventory.pending] = 0,
                            _b[inventoryCar_model_1.ChoicesStatusCarInventory.found] = 0,
                            _b[inventoryCar_model_1.ChoicesStatusCarInventory.leftover] = 0,
                            _b[inventoryCar_model_1.ChoicesStatusCarInventory.missing] = 0,
                            _b[inventoryCar_model_1.ChoicesStatusCarInventory.reported] = 0,
                            _b);
                        for (_i = 0, detailByBrands_1 = detailByBrands; _i < detailByBrands_1.length; _i++) {
                            db = detailByBrands_1[_i];
                            detailByBrand.push({
                                name: db._id ? db._id : 'Sin Marca',
                                results: db.status.reduce(function (acc, cur) {
                                    acc[cur.name] = cur.total;
                                    return acc;
                                }, __assign({}, defaultResults))
                            });
                        }
                        for (_a = 0, detailByVenues_1 = detailByVenues; _a < detailByVenues_1.length; _a++) {
                            dv = detailByVenues_1[_a];
                            detailByVenue.push({
                                _id: dv.info._id,
                                name: dv.info.name,
                                results: dv.status.reduce(function (acc, cur) {
                                    acc[cur.name] = cur.total;
                                    return acc;
                                }, __assign({}, defaultResults))
                            });
                        }
                        if (!(inventory && inventory.length)) return [3 /*break*/, 7];
                        currentInventory = inventory[0];
                        response = {
                            _id: currentInventory._id,
                            name: currentInventory.name,
                            createdBy: currentInventory.userInfo ? __assign(__assign({}, currentInventory.userInfo), { fullName: "".concat(currentInventory.userInfo.firstName, " ").concat(currentInventory.userInfo.lastName) }) : {},
                            results: currentInventory.results.reduce(function (acc, cur) {
                                acc[cur.status] = cur.total;
                                return acc;
                            }, __assign({}, defaultResults)),
                            status: currentInventory.status,
                            createdAt: currentInventory.createdAt,
                            finalizedAt: currentInventory.finalizedAt ? currentInventory.finalizedAt : null
                        };
                        return [4 /*yield*/, inventory_model_1["default"].findById(id, {
                                name: true,
                                status: true,
                                cars: true,
                                venues: true,
                                company: true,
                                team: true
                            }).populate([{
                                    path: 'cars',
                                    match: {
                                        $or: [
                                            {
                                                venue: {
                                                    $in: venuesPermissions
                                                }
                                            }, {
                                                venueFound: {
                                                    $in: venuesPermissions
                                                }
                                            }
                                        ],
                                        status: {
                                            $in: [
                                                inventoryCar_model_1.ChoicesStatusCarInventory.pending,
                                                inventoryCar_model_1.ChoicesStatusCarInventory.found,
                                                inventoryCar_model_1.ChoicesStatusCarInventory.missing,
                                                inventoryCar_model_1.ChoicesStatusCarInventory.leftover,
                                                inventoryCar_model_1.ChoicesStatusCarInventory.reported
                                            ]
                                        }
                                    },
                                    populate: [{
                                            path: 'car',
                                            select: ['vin', 'vin2', 'internalNumber', 'color', 'denomination', 'brand', 'venue', 'patent', 'internalNumber', 'property', 'type']
                                        }, {
                                            path: 'label'
                                        }, {
                                            path: 'venue',
                                            select: ['name']
                                        }, {
                                            path: 'images'
                                        }, {
                                            path: 'files'
                                        }, {
                                            path: 'venueFound',
                                            select: ['name']
                                        }, {
                                            path: 'inventoriedBy',
                                            select: ['firstName', 'lastName']
                                        }, {
                                            path: 'comments.user',
                                            select: ['_id', 'firstName', 'lastName']
                                        }]
                                }, {
                                    path: 'venues',
                                    select: ['_id', 'name'],
                                    match: {
                                        _id: {
                                            $in: venuesPermissions
                                        }
                                    },
                                    options: {
                                        sort: {
                                            name: 1
                                        }
                                    }
                                }]).lean()];
                    case 4:
                        detailInventory = _c.sent();
                        return [4 /*yield*/, teamSetting_model_1["default"].findOne({ team: team })];
                    case 5:
                        teamSettings = _c.sent();
                        return [4 /*yield*/, inventoryLabel_model_1["default"].find({
                                team: team,
                                active: true
                            }, {
                                name: true,
                                color: true,
                                affected: true,
                                sendTo: true,
                                isExhibition: true,
                                requireCustomText: true
                            })];
                    case 6:
                        labels = _c.sent();
                        res.json({
                            summary: response,
                            inventorySettings: teamSettings.inventory,
                            labels: labels,
                            detailByVenue: detailByVenue,
                            detailByBrand: detailByBrand,
                            detail: detailInventory,
                            status: 200
                        });
                        return [3 /*break*/, 8];
                    case 7:
                        console.log('inventory', inventory);
                        res.status(404).json({
                            message: 'Inventario no encontrado',
                            status: 404
                        });
                        _c.label = 8;
                    case 8: return [3 /*break*/, 10];
                    case 9:
                        e_18 = _c.sent();
                        /* istanbul ignore next */
                        logger_service_1["default"].error("detaill: Async Error.");
                        /* istanbul ignore next */
                        logger_service_1["default"].error("{user: {_id: ".concat(req.user._id, ", email: ").concat(req.user.email, "}}"));
                        /* istanbul ignore next */
                        logger_service_1["default"].error(e_18);
                        /* istanbul ignore next */
                        res.status(400).json({
                            message: e_18,
                            status: 400
                        });
                        return [3 /*break*/, 10];
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    InventoryController.prototype.dashboard = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var venuesPermissions, venues, team, total, inventory, data, defaultResults, i, month, _i, inventory_2, item, teamSettings, e_19;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        venuesPermissions = req.user.venuesPermissions();
                        venues = req.body.venues;
                        team = req.user.team._id;
                        if (venues && venues.length) {
                            venuesPermissions = venuesPermissions.filter(function (v) { return venues.includes(v.toString()); });
                        }
                        total = 6;
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, inventoryCar_model_1["default"].aggregate([{
                                    $match: {
                                        createdAt: {
                                            $gte: moment()
                                                .subtract(total, 'months')
                                                .startOf('month')
                                                .toDate()
                                        },
                                        venue: {
                                            $in: venuesPermissions
                                        }
                                    }
                                }, {
                                    $group: {
                                        _id: {
                                            status: '$status',
                                            month: {
                                                $dateToString: { format: '%Y-%m', date: '$createdAt' }
                                            }
                                        },
                                        total: {
                                            $sum: 1
                                        }
                                    }
                                }, {
                                    $group: {
                                        _id: '$_id.month',
                                        results: {
                                            $push: {
                                                status: '$_id.status',
                                                total: '$total'
                                            }
                                        }
                                    }
                                }])];
                    case 2:
                        inventory = _b.sent();
                        data = {};
                        defaultResults = (_a = {},
                            _a[inventoryCar_model_1.ChoicesStatusCarInventory.pending] = 0,
                            _a[inventoryCar_model_1.ChoicesStatusCarInventory.found] = 0,
                            _a[inventoryCar_model_1.ChoicesStatusCarInventory.missing] = 0,
                            _a[inventoryCar_model_1.ChoicesStatusCarInventory.reported] = 0,
                            _a[inventoryCar_model_1.ChoicesStatusCarInventory.leftover] = 0,
                            _a);
                        for (i = 0; i <= total; i++) {
                            month = moment()
                                .subtract(total - i, 'months')
                                .format('YYYY-MM');
                            data[month] = __assign({}, defaultResults);
                        }
                        for (_i = 0, inventory_2 = inventory; _i < inventory_2.length; _i++) {
                            item = inventory_2[_i];
                            data[item._id] = item.results.reduce(function (acc, cur) {
                                acc[cur.status] = cur.total;
                                return acc;
                            }, __assign({}, defaultResults));
                        }
                        return [4 /*yield*/, teamSetting_model_1["default"].findOne({ team: team })];
                    case 3:
                        teamSettings = _b.sent();
                        res.json({
                            data: data,
                            inventorySettings: teamSettings.inventory
                        });
                        return [3 /*break*/, 5];
                    case 4:
                        e_19 = _b.sent();
                        /* istanbul ignore next */
                        logger_service_1["default"].error("inventory dashboard: Async Error.");
                        /* istanbul ignore next */
                        logger_service_1["default"].error("{user: {_id: ".concat(req.user._id, ", email: ").concat(req.user.email, "}}"));
                        /* istanbul ignore next */
                        logger_service_1["default"].error(e_19);
                        Raven.captureException(e_19, { req: req });
                        /* istanbul ignore next */
                        res.status(500).json({
                            message: JSON.stringify(e_19),
                            status: 500
                        });
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    InventoryController.prototype.inventoryByCars = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var team, workbook, worksheet, columns, venues, _i, venues_1, venue, cars, _a, cars_1, car, inventories, carData, _b, inventories_2, inventory, tempFilePath, e_20;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        team = req.user.team._id;
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 5, , 6]);
                        workbook = new excel.Workbook();
                        worksheet = workbook.addWorksheet('Detalle', {
                            properties: {
                                defaultRowHeight: 30
                            }, pageSetup: {
                                fitToPage: true, fitToHeight: 100, fitToWidth: 1
                            }
                        });
                        worksheet.views = [{
                                state: 'frozen',
                                xSplit: 3,
                                ySplit: 1,
                                topLeftCell: 'D2',
                                activeCell: 'D2'
                            }];
                        columns = [{
                                header: 'VIN',
                                key: 'vin',
                                width: 30,
                                alignment: {
                                    wrapText: true
                                }
                            }, {
                                header: 'MARCA',
                                key: 'marca',
                                width: 30,
                                alignment: {
                                    wrapText: true
                                }
                            }, {
                                header: 'MODELO',
                                key: 'modelo',
                                width: 40,
                                alignment: {
                                    wrapText: true
                                }
                            }];
                        return [4 /*yield*/, venue_model_1["default"].find({ team: team, deleted: false }).sort('name')];
                    case 2:
                        venues = _c.sent();
                        for (_i = 0, venues_1 = venues; _i < venues_1.length; _i++) {
                            venue = venues_1[_i];
                            columns.push({
                                header: venue.name, key: venue._id.toString(), width: 5,
                                style: {
                                    alignment: {
                                        vertical: 'middle',
                                        horizontal: 'center'
                                    }
                                }
                            });
                        }
                        worksheet.columns = columns;
                        worksheet.autoFilter = {
                            from: 'A1',
                            to: {
                                row: 1,
                                column: columns.length
                            }
                        };
                        worksheet.getColumn(1).eachCell(function (cell) {
                            cell.alignment = {
                                vertical: 'middle',
                                textRotation: 0,
                                wrapText: true
                            };
                            cell.font = {
                                bold: true
                            };
                        });
                        worksheet.getRow(1).eachCell(function (cell) {
                            var alignment = {
                                vertical: 'middle',
                                horizontal: 'center',
                                textRotation: 0,
                                wrapText: true
                            };
                            if (parseInt(cell.col, 10) > 3) {
                                alignment.textRotation = 90;
                            }
                            cell.alignment = alignment;
                            cell.font = {
                                bold: true
                            };
                        });
                        return [4 /*yield*/, car_model_1["default"].find({
                                team: team,
                                isExhibition: false,
                                createdAt: {
                                    $gte: moment().subtract(6, 'months')
                                    //   $lte: tf,
                                }
                            }, {
                                vin: true,
                                denomination: true,
                                color: true,
                                brand: true
                            }).populate({
                                path: 'inventories',
                                select: ['name', 'createdAt', 'venueFound', 'status'],
                                match: {
                                    status: {
                                        $in: [inventoryCar_model_1.ChoicesStatusCarInventory.found]
                                    }
                                },
                                options: {
                                    sort: {
                                        createdAt: 1
                                    }
                                }
                            })];
                    case 3:
                        cars = _c.sent();
                        for (_a = 0, cars_1 = cars; _a < cars_1.length; _a++) {
                            car = cars_1[_a];
                            inventories = car.inventories;
                            if (inventories.length) {
                                carData = {
                                    vin: car.vin,
                                    marca: car.brand,
                                    modelo: car.denomination
                                };
                                for (_b = 0, inventories_2 = inventories; _b < inventories_2.length; _b++) {
                                    inventory = inventories_2[_b];
                                    carData[inventory.venueFound] = carData.hasOwnProperty(inventory.venueFound) ? carData[inventory.venueFound] + 1 : 1;
                                }
                                worksheet.addRow(carData);
                            }
                        }
                        tempFilePath = tempfile('.xlsx');
                        return [4 /*yield*/, workbook.xlsx.writeFile(tempFilePath)];
                    case 4:
                        _c.sent();
                        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                        res.setHeader('Content-Disposition', 'attachment; filename=detalle-inventarios.xlsx');
                        return [2 /*return*/, res.sendFile(tempFilePath)];
                    case 5:
                        e_20 = _c.sent();
                        console.log(e_20);
                        return [2 /*return*/, res.status(500).json({
                                message: 'Ha ocurrido un error. Comunicate con soporte para que te ayudemos a solucionarlo.'
                            })];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    InventoryController.prototype.loadStock = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var company, team, carsByVenue, stockCars, _i, carsByVenue_2, venue, venueRegExp, currentVenue, _a, _b, car, currentCar, stock_1, e_21;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        company = req.user.company;
                        team = req.user.team._id;
                        carsByVenue = req.body.carsByVenue;
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 15, , 16]);
                        stockCars = [];
                        _i = 0, carsByVenue_2 = carsByVenue;
                        _c.label = 2;
                    case 2:
                        if (!(_i < carsByVenue_2.length)) return [3 /*break*/, 12];
                        venue = carsByVenue_2[_i];
                        venueRegExp = new RegExp("^".concat(venue.name.trim(), "$"), 'i');
                        return [4 /*yield*/, venue_model_1["default"].findOne({
                                team: team,
                                name: venueRegExp
                            })];
                    case 3:
                        currentVenue = _c.sent();
                        if (!(currentVenue === null)) return [3 /*break*/, 5];
                        currentVenue = new venue_model_1["default"]({
                            name: venue.name.trim(),
                            team: team,
                            company: company
                        });
                        return [4 /*yield*/, currentVenue.save()];
                    case 4:
                        _c.sent();
                        _c.label = 5;
                    case 5:
                        _a = 0, _b = venue.cars;
                        _c.label = 6;
                    case 6:
                        if (!(_a < _b.length)) return [3 /*break*/, 11];
                        car = _b[_a];
                        return [4 /*yield*/, car_model_1["default"].findOne({
                                team: team,
                                vin: car.vin.trim()
                            })];
                    case 7:
                        currentCar = _c.sent();
                        if (!(currentCar === null && car.vin && car.vin.trim().length)) return [3 /*break*/, 9];
                        currentCar = new car_model_1["default"]({
                            team: team,
                            company: company,
                            vin: car.vin,
                            vin2: car.vin.substr(car.vin.length - 6),
                            color: car.color,
                            type: car.type,
                            property: car.property,
                            denomination: car.denomination,
                            brand: car.brand,
                            patent: car.patent,
                            createdBy: req.user,
                            status: car_model_1.ChoicesStatusCar.active
                        });
                        return [4 /*yield*/, currentCar.save()];
                    case 8:
                        _c.sent();
                        _c.label = 9;
                    case 9:
                        if (currentVenue && currentCar) {
                            stockCars.push({
                                venue: currentVenue._id,
                                car: currentCar._id
                            });
                            app_1.queue
                                .create('updateCar', {
                                title: "updateCar ".concat(car.vin),
                                currentCar: currentCar._id,
                                car: car
                            })
                                .delay(10000)
                                .priority('high')
                                .attempts(5)
                                .save();
                        }
                        _c.label = 10;
                    case 10:
                        _a++;
                        return [3 /*break*/, 6];
                    case 11:
                        _i++;
                        return [3 /*break*/, 2];
                    case 12:
                        stock_1 = new stock_model_1["default"]({
                            company: company,
                            team: team,
                            createdBy: req.user._id
                        });
                        return [4 /*yield*/, stock_1.save()];
                    case 13:
                        _c.sent();
                        stockCars.map(function (s) {
                            s.stock = stock_1._id;
                            return s;
                        });
                        return [4 /*yield*/, stockCar_model_1["default"].insertMany(stockCars)];
                    case 14:
                        _c.sent();
                        server_1.io.to("stock-".concat(team)).emit('REFRESH', {
                            update: true
                        });
                        res.json({
                            message: 'Stock creado satisfactoriamente',
                            status: 200
                        });
                        return [3 /*break*/, 16];
                    case 15:
                        e_21 = _c.sent();
                        /* istanbul ignore next */
                        logger_service_1["default"].error("loadStock: Async Error.");
                        /* istanbul ignore next */
                        logger_service_1["default"].error("{user: {_id: ".concat(req.user._id, ", email: ").concat(req.user.email, "}}"));
                        /* istanbul ignore next */
                        logger_service_1["default"].error(e_21);
                        /* istanbul ignore next */
                        res.status(500).json({
                            message: e_21,
                            status: 500
                        });
                        return [3 /*break*/, 16];
                    case 16: return [2 /*return*/];
                }
            });
        });
    };
    InventoryController.prototype.currentStock = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, company, venue, lastInventory, lastStock, showInventory, showStock, inventory, stock, e_22;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 11, , 12]);
                        _a = req.user, company = _a.company, venue = _a.venue;
                        return [4 /*yield*/, inventory_model_1["default"]
                                .findOne({
                                company: company
                            }, {
                                name: true,
                                status: true,
                                cars: true,
                                createdAt: true
                            }, {
                                sort: { 'createdAt': -1 }
                            })];
                    case 1:
                        lastInventory = _b.sent();
                        return [4 /*yield*/, stock_model_1["default"]
                                .findOne({
                                company: company
                            }, {}, {
                                sort: { 'createdAt': -1 }
                            })];
                    case 2:
                        lastStock = _b.sent();
                        showInventory = false;
                        showStock = false;
                        if (lastInventory && !lastStock) {
                            showInventory = true;
                            console.log('showInventory');
                        }
                        else if (!lastInventory && lastStock) {
                            showStock = true;
                            console.log('showStock');
                        }
                        else if (lastInventory && lastStock) {
                            console.log('lastInventory.createdAt', lastInventory.createdAt);
                            console.log('lastStock.createdAt', lastStock.createdAt);
                            console.log('moment(lastInventory.createdAt).isAfter(lastStock.createdAt)', moment(lastInventory.createdAt).isAfter(lastStock.createdAt));
                            if (moment(lastInventory.createdAt).isAfter(lastStock.createdAt)) {
                                showInventory = true;
                                console.log('showInventory');
                            }
                            else {
                                showStock = true;
                                console.log('showStock');
                            }
                        }
                        if (!showInventory) return [3 /*break*/, 8];
                        return [4 /*yield*/, inventory_model_1["default"]
                                .findOne({
                                company: company
                            }, {
                                name: true,
                                status: true,
                                cars: true
                            }, {
                                sort: { 'createdAt': -1 }
                            })
                                .populate([{
                                    path: 'cars',
                                    select: ['_id', 'car', 'venue', 'venueFound'],
                                    match: {
                                        status: {
                                            $in: [
                                                inventoryCar_model_1.ChoicesStatusCarInventory.found,
                                                inventoryCar_model_1.ChoicesStatusCarInventory.leftover
                                            ]
                                        }
                                    },
                                    populate: [{
                                            path: 'car',
                                            select: ['vin', 'vin2', 'internalNumber', 'color', 'denomination', 'brand', 'venue', 'patent', 'internalNumber', 'property', 'type']
                                        }, {
                                            path: 'venue',
                                            select: ['name'],
                                            populate: [{
                                                    path: 'region',
                                                    select: ['code', 'name']
                                                }]
                                        }, {
                                            path: 'venueFound',
                                            select: ['name'],
                                            populate: [{
                                                    path: 'region',
                                                    select: ['code', 'name']
                                                }]
                                        }]
                                }]).lean()];
                    case 3:
                        inventory = _b.sent();
                        if (!!inventory) return [3 /*break*/, 4];
                        res
                            .status(200)
                            .json({
                            message: 'No se han realizado inventarios para ver el stock.',
                            cars: []
                        });
                        return [3 /*break*/, 7];
                    case 4:
                        if (!(inventory.status !== inventory_model_1.ChoicesStatusInventory.finalized)) return [3 /*break*/, 5];
                        res
                            .status(200)
                            .json({
                            message: 'Se esta procesando la toma de inventario.',
                            cars: []
                        });
                        return [3 /*break*/, 7];
                    case 5: return [4 /*yield*/, inventoryCar_model_1["default"].find({ inventory: inventory, venue: venue, status: inventoryCar_model_1.ChoicesStatusCarInventory.pending }).count()];
                    case 6:
                        if (_b.sent()) {
                            res
                                .status(200)
                                .json({
                                message: 'Tú sucursal no ha terminado el inventario.',
                                cars: []
                            });
                        }
                        else {
                            res
                                .status(200)
                                .json({
                                message: '',
                                cars: inventory.cars
                            });
                        }
                        _b.label = 7;
                    case 7: return [3 /*break*/, 10];
                    case 8:
                        if (!showStock) return [3 /*break*/, 10];
                        return [4 /*yield*/, stock_model_1["default"]
                                .findOne({
                                company: company
                            }, {
                                name: true,
                                status: true,
                                cars: true
                            }, {
                                sort: { 'createdAt': -1 }
                            })
                                .populate([{
                                    path: 'cars',
                                    select: ['_id', 'car', 'venue'],
                                    populate: [{
                                            path: 'car',
                                            select: ['vin', 'vin2', 'internalNumber', 'color', 'denomination', 'brand', 'venue', 'patent', 'internalNumber', 'property', 'type']
                                        }, {
                                            path: 'venue',
                                            select: ['name'],
                                            populate: [{
                                                    path: 'region',
                                                    select: ['code', 'name']
                                                }]
                                        }]
                                }]).lean()];
                    case 9:
                        stock = _b.sent();
                        res
                            .status(200)
                            .json({
                            message: '',
                            cars: stock.cars
                        });
                        _b.label = 10;
                    case 10: return [3 /*break*/, 12];
                    case 11:
                        e_22 = _b.sent();
                        /* istanbul ignore next */
                        logger_service_1["default"].error("inventory currentStock: Async Error.");
                        /* istanbul ignore next */
                        logger_service_1["default"].error("{user: {_id: ".concat(req.user._id, ", email: ").concat(req.user.email, "}}"));
                        /* istanbul ignore next */
                        logger_service_1["default"].error(e_22);
                        Raven.captureException(e_22, { req: req });
                        /* istanbul ignore next */
                        res.status(500).json({
                            message: JSON.stringify(e_22),
                            status: 500
                        });
                        return [3 /*break*/, 12];
                    case 12: return [2 /*return*/];
                }
            });
        });
    };
    InventoryController.prototype.autoRotate = function (path) {
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
    InventoryController.prototype.resizeImage = function (path) {
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
    return InventoryController;
}());
exports["default"] = new InventoryController();
//# sourceMappingURL=inventory.controller.js.map