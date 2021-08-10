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
var __spreadArray = (this && this.__spreadArray) || function (to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
};
exports.__esModule = true;
var bluebird = require("bluebird");
var excel = require("exceljs");
var moment = require("moment-timezone");
var mongoose = require("mongoose");
var tempfile = require("tempfile");
var form_model_1 = require("../../form/models/form.model");
var kind_model_1 = require("../../form/models/kind.model");
var part_model_1 = require("../../form/models/part.model");
var participant_model_1 = require("../../form/models/participant.model");
var position_model_1 = require("../../form/models/position.model");
var inventory_model_1 = require("../../inventory/models/inventory.model");
var inventoryCar_model_1 = require("../../inventory/models/inventoryCar.model");
var planning_model_1 = require("../../planning/models/planning.model");
var logger_service_1 = require("../../services/logger.service");
// import VINService from '../../services/vin.service';
var car_model_1 = require("../models/car.model");
var user_model_1 = require("../models/user.model");
var venue_model_1 = require("../models/venue.model");
moment.tz.setDefault('America/Santiago');
var CarController = /** @class */ (function () {
    function CarController() {
        this.carBrands = {
            'VF1': 'RENAULT',
            'VF2': 'RENAULT',
            'VF6': 'RENAULT',
            '8A1': 'RENAULT',
            '93Y': 'RENAULT',
            '9FB': 'RENAULT',
            '3BR': 'RENAULT',
            'JC1': 'MAZDA',
            'JMZ': 'MAZDA',
            'JM6': 'MAZDA',
            'JM7': 'MAZDA',
            'PE3': 'MAZDA',
            'MM8': 'MAZDA',
            'MM0': 'MAZDA',
            'MM7': 'MAZDA',
            '1YV': 'MAZDA',
            '3MD': 'MAZDA',
            'JS2': 'SUZUKI',
            'MMS': 'SUZUKI',
            'JS3': 'SUZUKI',
            'IJS': 'SUZUKI',
            'TSM': 'SUZUKI',
            'MA3': 'SUZUKI',
            'MHY': 'SUZUKI',
            'LJ1': 'JAC',
            'LS4': 'CHANGAN',
            'LSC': 'CHANGAN',
            'LS5': 'CHANGAN',
            'LPA': 'CHANGAN',
            'LVR': 'CHANGAN',
            'LVS': 'CHANGAN',
            'LGW': 'GREAT WALL'
        };
        this.generalDashboard = this.generalDashboard.bind(this);
        this.vinDashboard = this.vinDashboard.bind(this);
        this.vinDashboardDetail = this.vinDashboardDetail.bind(this);
        this.checkVIN = this.checkVIN.bind(this);
        this.processDamagedCar = this.processDamagedCar.bind(this);
        this.apiDamagesExport = this.apiDamagesExport.bind(this);
        this.addRevisions = this.addRevisions.bind(this);
        this.apiCars = this.apiCars.bind(this);
        this.apiRevisions = this.apiRevisions.bind(this);
        this.apiCarDetail = this.apiCarDetail.bind(this);
        this.getCars = this.getCars.bind(this);
        this.apiParticipantDetail = this.apiParticipantDetail.bind(this);
        this.apiParticipantsPerDate = this.apiParticipantsPerDate.bind(this);
        this.processParticipant = this.processParticipant.bind(this);
        this.exportParticipants = this.exportParticipants.bind(this);
        this.listProperties = this.listProperties.bind(this);
        this.createCar = this.createCar.bind(this);
    }
    CarController.prototype.generalDashboard = function (req, res) {
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
    CarController.prototype.vinDashboard = function (req, res) {
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
    CarController.prototype.createCar = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var car, _a, company, team, newCar, e_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 6, , 7]);
                        car = req.body;
                        _a = req.user, company = _a.company, team = _a.team;
                        return [4 /*yield*/, car_model_1["default"].findOne({
                                vin: car.vin,
                                team: team
                            })];
                    case 1:
                        newCar = _b.sent();
                        if (!newCar) return [3 /*break*/, 3];
                        newCar.vin2 = car.vin2;
                        newCar.color = car.color ? car.color : newCar.color;
                        newCar.denomination = car.denomination ? car.denomination : newCar.denomination;
                        newCar.brand = car.brand ? car.brand : newCar.brand;
                        newCar.patent = car.patent ? car.patent : newCar.patent;
                        newCar.imported = false;
                        newCar.createdBy = req.user;
                        newCar.status = car_model_1.ChoicesStatusCar.active;
                        return [4 /*yield*/, newCar.save()];
                    case 2:
                        _b.sent();
                        return [3 /*break*/, 5];
                    case 3: return [4 /*yield*/, car_model_1["default"].create({
                            vin: car.vin,
                            vin2: car.vin2,
                            color: car.color ? car.color : '',
                            denomination: car.denomination ? car.denomination : '',
                            brand: car.brand ? car.brand : '',
                            patent: car.patent ? car.patent : '',
                            imported: false,
                            company: company,
                            team: team,
                            createdBy: req.user,
                            status: car_model_1.ChoicesStatusCar.active
                        })];
                    case 4:
                        _b.sent();
                        _b.label = 5;
                    case 5:
                        res.json({
                            status: 200
                        });
                        return [3 /*break*/, 7];
                    case 6:
                        e_1 = _b.sent();
                        /* istanbul ignore next */
                        console.log(e_1);
                        return [3 /*break*/, 7];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    CarController.prototype.listProperties = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var team, cars, e_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        team = req.user.team;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, car_model_1["default"].aggregate([
                                {
                                    $match: {
                                        team: team._id
                                    }
                                },
                                {
                                    $group: {
                                        _id: null,
                                        uniqueValues: {
                                            $addToSet: '$property'
                                        }
                                    }
                                }
                            ])];
                    case 2:
                        cars = _a.sent();
                        if (cars.length && cars[0].hasOwnProperty('uniqueValues')) {
                            res.json(cars[0].uniqueValues
                                .filter(function (v) { return (v.length > 0); })
                                .map(function (v) { return ({ _id: v, name: v }); })
                                .sort(function (a, b) {
                                var x = a.name;
                                var y = b.name;
                                return ((x < y) ? -1 : ((x > y) ? 1 : 0));
                            }));
                        }
                        else {
                            res.json([]);
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        e_2 = _a.sent();
                        /* istanbul ignore next */
                        if (e_2) {
                            res.status(500).send(e_2);
                        }
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    CarController.prototype.vinDashboardDetail = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var id, team, _a, car, _b, _c, _d, _e, _f, e_3;
            var _g, _h, _j;
            return __generator(this, function (_k) {
                switch (_k.label) {
                    case 0:
                        id = req.params.id;
                        team = req.user.team;
                        _a = !mongoose.Types.ObjectId.isValid(id);
                        if (_a) return [3 /*break*/, 2];
                        return [4 /*yield*/, car_model_1["default"].find({ _id: id, team: team }).count()];
                    case 1:
                        _a = !(_k.sent());
                        _k.label = 2;
                    case 2:
                        // validate params
                        /* istanbul ignore next */
                        if (_a) {
                            return [2 /*return*/, res.redirect('/cars/')];
                            // return res.status(404).render('404');
                        }
                        _k.label = 3;
                    case 3:
                        _k.trys.push([3, 9, , 10]);
                        _c = (_b = car_model_1["default"]).findOne;
                        _g = {
                            _id: id
                        };
                        _h = {
                            $exists: true,
                            $ne: null
                        };
                        return [4 /*yield*/, participant_model_1["default"].find({
                                venue: {
                                    $in: req.user.venuesPermissions()
                                }
                            }, {
                                _id: true
                            })];
                    case 4: return [4 /*yield*/, _c.apply(_b, [(_g.lastForm = (_h.$in = _k.sent(),
                                _h),
                                _g.team = team._id,
                                _g)])];
                    case 5:
                        car = _k.sent();
                        if (!!car) return [3 /*break*/, 6];
                        return [2 /*return*/, res.status(404).render('404')];
                    case 6:
                        _e = (_d = res).render;
                        _f = ['app/index'];
                        _j = {};
                        return [4 /*yield*/, req.user.generateToken()];
                    case 7:
                        _e.apply(_d, _f.concat([(_j.token = _k.sent(), _j)]));
                        _k.label = 8;
                    case 8: return [3 /*break*/, 10];
                    case 9:
                        e_3 = _k.sent();
                        /* istanbul ignore next */
                        if (e_3) {
                            res.status(500).send(e_3);
                        }
                        return [3 /*break*/, 10];
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    CarController.prototype.checkVIN = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, vin, vin2, inventory, team, inventoryStatus, inventoryQuery, vinRegex, patentRegex, cars, carsByID, inventoriedCar, carsInInventory, _loop_1, _i, _b, car, e_4, inventoryQuery, vinRegex, patentRegex, car, e_5;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _a = req.body, vin = _a.vin, vin2 = _a.vin2;
                        inventory = req.body.inventory;
                        team = req.user.team._id;
                        logger_service_1["default"].info("checkVIN");
                        logger_service_1["default"].info("{user: {_id: " + req.user._id + ", email: " + req.user.email + "}, body: " + JSON.stringify(req.body) + "}");
                        if (vin) {
                            vin = vin.replace(/[\W_]+/g, '');
                            logger_service_1["default"].info("VIN fixed: " + vin);
                        }
                        if (!inventory) return [3 /*break*/, 10];
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 8, , 9]);
                        return [4 /*yield*/, inventory_model_1["default"].findOne({
                                _id: inventory
                            }, { status: true })];
                    case 2:
                        inventoryStatus = _c.sent();
                        if (!(inventoryStatus && inventoryStatus.status !== inventory_model_1.ChoicesStatusInventory.inProcess)) return [3 /*break*/, 3];
                        logger_service_1["default"].error("checkVIN: Este inventario ya no se encuentra disponible.");
                        logger_service_1["default"].error("{user: {_id: " + req.user._id + ", email: " + req.user.email + "}}");
                        res.status(404).json({
                            message: 'Este inventario ya no se encuentra disponible.',
                            status: 404
                        });
                        return [3 /*break*/, 7];
                    case 3:
                        inventoryQuery = {
                            team: team
                        };
                        if (vin) {
                            inventoryQuery.vin = vin;
                        }
                        if (vin2) {
                            if (vin2[0] === '0') {
                                vinRegex = new RegExp(vin2.substr(vin2.length - 5), 'i');
                                inventoryQuery.vin2 = { $regex: vinRegex };
                            }
                            else {
                                patentRegex = new RegExp(vin2, 'i');
                                inventoryQuery.$or = [{ vin2: vin2 }, { patent: patentRegex }];
                            }
                        }
                        return [4 /*yield*/, car_model_1["default"].find(inventoryQuery, {
                                vin: true,
                                vin2: true,
                                brand: true,
                                color: true,
                                patent: true,
                                denomination: true
                            })];
                    case 4:
                        cars = _c.sent();
                        if (!cars.length) return [3 /*break*/, 6];
                        carsByID = cars.reduce(function (acc, cur) {
                            acc[cur._id.toString()] = cur;
                            return acc;
                        }, {});
                        return [4 /*yield*/, inventory_model_1["default"].findOne({
                                _id: inventory,
                                team: team,
                                status: inventory_model_1.ChoicesStatusInventory.inProcess
                            }, {
                                'cars.car': true,
                                'cars.status': true,
                                'cars.venue': true
                            }).populate([{
                                    path: 'cars',
                                    populate: [{
                                            path: 'venue',
                                            select: ['name']
                                        }]
                                }])];
                    case 5:
                        inventoriedCar = _c.sent();
                        if (inventoriedCar) {
                            carsInInventory = [];
                            _loop_1 = function (car) {
                                if (carsByID.hasOwnProperty(car.car)) {
                                    var carToAdd = cars.find(function (ci) {
                                        return ci._id.toString() === car.car.toString();
                                    });
                                    if (carToAdd && car.status !== inventoryCar_model_1.ChoicesStatusCarInventory.leftover) {
                                        carsInInventory.push({
                                            _id: carToAdd._id,
                                            vin: carToAdd.vin,
                                            vin2: carToAdd.vin2,
                                            color: carToAdd.color,
                                            denomination: carToAdd.denomination,
                                            status: car.status,
                                            venue: car.venue,
                                            brand: carToAdd.brand
                                        });
                                    }
                                }
                            };
                            for (_i = 0, _b = inventoriedCar.cars; _i < _b.length; _i++) {
                                car = _b[_i];
                                _loop_1(car);
                            }
                            if (carsInInventory.length) {
                                res.json({
                                    data: vin2 ? carsInInventory : carsInInventory[0],
                                    status: 200
                                });
                            }
                            else {
                                logger_service_1["default"].error("checkVIN: VIN no v\u00E1lido 1.");
                                logger_service_1["default"].error("{user: {_id: " + req.user._id + ", email: " + req.user.email + "}}");
                                res.status(400).json({
                                    message: 'VIN no válido.',
                                    status: 400
                                });
                            }
                        }
                        else {
                            logger_service_1["default"].error("checkVIN: Este inventario ya no se encuentra disponible.");
                            logger_service_1["default"].error("{user: {_id: " + req.user._id + ", email: " + req.user.email + "}}");
                            res.status(404).json({
                                message: 'Este inventario ya no se encuentra disponible.',
                                status: 404
                            });
                        }
                        return [3 /*break*/, 7];
                    case 6:
                        logger_service_1["default"].error("checkVIN: VIN no v\u00E1lido 2.");
                        logger_service_1["default"].error("{user: {_id: " + req.user._id + ", email: " + req.user.email + "}}");
                        res.status(400).json({
                            message: 'VIN no válido.',
                            status: 400
                        });
                        _c.label = 7;
                    case 7: return [3 /*break*/, 9];
                    case 8:
                        e_4 = _c.sent();
                        /* istanbul ignore next */
                        if (e_4) {
                            /* istanbul ignore next */
                            logger_service_1["default"].error("checkVIN: Async Error.");
                            /* istanbul ignore next */
                            logger_service_1["default"].error("{user: {_id: " + req.user._id + ", email: " + req.user.email + "}}");
                            /* istanbul ignore next */
                            logger_service_1["default"].error(e_4);
                            res.status(500).json(e_4);
                        }
                        return [3 /*break*/, 9];
                    case 9: return [3 /*break*/, 13];
                    case 10:
                        _c.trys.push([10, 12, , 13]);
                        inventoryQuery = {
                            team: team
                        };
                        if (vin) {
                            inventoryQuery.vin = vin;
                        }
                        if (vin2) {
                            if (vin2[0] === '0') {
                                vinRegex = new RegExp(vin2.substr(vin2.length - 5), 'i');
                                inventoryQuery.vin2 = { $regex: vinRegex };
                            }
                            else {
                                patentRegex = new RegExp(vin2, 'i');
                                inventoryQuery.$or = [{ vin2: vin2 }, { patent: patentRegex }];
                            }
                        }
                        return [4 /*yield*/, car_model_1["default"].find(inventoryQuery, {
                                vin: true,
                                vin2: true,
                                brand: true,
                                color: true,
                                patent: true,
                                denomination: true
                            })];
                    case 11:
                        car = _c.sent();
                        if (car && car.length) {
                            res.json({
                                data: vin ? car[0] : car,
                                status: 200
                            });
                        }
                        else {
                            logger_service_1["default"].error("checkVIN: VIN no encontrado.");
                            logger_service_1["default"].error("{user: {_id: " + req.user._id + ", email: " + req.user.email + "}}");
                            res.status(400).json({
                                message: 'VIN no encontrado.',
                                status: 400
                            });
                        }
                        return [3 /*break*/, 13];
                    case 12:
                        e_5 = _c.sent();
                        /* istanbul ignore next */
                        if (e_5) {
                            /* istanbul ignore next */
                            logger_service_1["default"].error("checkVIN: Async Error.");
                            /* istanbul ignore next */
                            logger_service_1["default"].error("{user: {_id: " + req.user._id + ", email: " + req.user.email + "}}");
                            /* istanbul ignore next */
                            logger_service_1["default"].error(e_5);
                            res.status(500).send(e_5);
                        }
                        return [3 /*break*/, 13];
                    case 13: return [2 /*return*/];
                }
            });
        });
    };
    CarController.prototype.apiParticipantsPerDate = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var team, companies, venuesPermissions, query, venuesByCompanies, venuesPermissionsFilterByCompanies, participantReceivedPerDay, participantSentPerDay, importCarsPerDay, planningPerDay, planningByProcessing, planningByProcessingByKey, _loop_2, _i, planningByProcessing_1, process_1, participantsReceived, planning, planningProcess, participantsSent, cars, _loop_3, i, proyection, proyectionInterval, i, max, participantPerRange, venues, companiesData, companiesIDS, _a, venues_1, venue, companieID, _b, _c, e_6;
            var _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        team = req.user.team._id;
                        _e.label = 1;
                    case 1:
                        _e.trys.push([1, 11, , 12]);
                        companies = req.query.companies;
                        venuesPermissions = req.user.venuesPermissions();
                        query = {
                            _id: {
                                $in: venuesPermissions
                            }
                        };
                        if (companies) {
                            query.company = {
                                $in: [companies]
                            };
                        }
                        return [4 /*yield*/, venue_model_1["default"].find(query)];
                    case 2:
                        venuesByCompanies = _e.sent();
                        venuesPermissionsFilterByCompanies = venuesByCompanies.map(function (venue) { return venue._id; });
                        return [4 /*yield*/, participant_model_1["default"]
                                .aggregate([
                                {
                                    $match: {
                                        venue: {
                                            $in: venuesPermissionsFilterByCompanies
                                        },
                                        reception: true,
                                        createdAt: {
                                            $gte: moment().subtract(30, 'd').toDate()
                                        }
                                    }
                                }, {
                                    $project: {
                                        _id: 1, user: 1, form: 1, car: 1, createdAt: {
                                            $subtract: ['$createdAt', 4 * 60 * 60 * 1000]
                                        }
                                    }
                                }, {
                                    $group: {
                                        // _id: {
                                        //   $dateToString: {
                                        //     format: '%Y-%m-%d',
                                        //     date: '$createdAt'
                                        //   },
                                        // },
                                        _id: {
                                            category: {
                                                $dateToString: {
                                                    format: '%Y-%m-%d',
                                                    date: '$createdAt',
                                                    timezone: 'America/Santiago'
                                                }
                                            },
                                            user: '$user'
                                        },
                                        total: {
                                            $sum: 1
                                        }
                                    }
                                }, {
                                    $lookup: {
                                        from: 'users',
                                        localField: '_id.user',
                                        foreignField: '_id',
                                        as: 'userInfo'
                                    }
                                }, {
                                    $unwind: '$userInfo'
                                }, {
                                    $project: {
                                        '_id.category': 1,
                                        '_id.user': 1,
                                        'total': 1,
                                        'userInfo._id': 1,
                                        'userInfo.firstName': 1,
                                        'userInfo.lastName': 1
                                    }
                                }, {
                                    $group: {
                                        _id: '$_id.category',
                                        users: {
                                            $push: {
                                                user: '$_id.user',
                                                userInfo: '$userInfo',
                                                total: '$total'
                                            }
                                        },
                                        total: { $sum: '$total' }
                                    }
                                }, {
                                    $sort: {
                                        _id: 1
                                    }
                                }
                            ])];
                    case 3:
                        participantReceivedPerDay = _e.sent();
                        return [4 /*yield*/, participant_model_1["default"]
                                .aggregate([
                                {
                                    $match: {
                                        venue: {
                                            $in: venuesPermissionsFilterByCompanies
                                        },
                                        shipping: true,
                                        createdAt: {
                                            $gte: moment().subtract(30, 'd').toDate()
                                        }
                                    }
                                }, {
                                    $project: {
                                        _id: 1,
                                        user: 1,
                                        form: 1,
                                        car: 1,
                                        createdAt: {
                                            $subtract: ['$createdAt', 4 * 60 * 60 * 1000]
                                        }
                                    }
                                }, {
                                    $group: {
                                        // _id: {
                                        //   $dateToString: {
                                        //     format: '%Y-%m-%d',
                                        //     date: '$createdAt'
                                        //   },
                                        // },
                                        _id: {
                                            category: {
                                                $dateToString: {
                                                    format: '%Y-%m-%d',
                                                    date: '$createdAt',
                                                    timezone: 'America/Santiago'
                                                }
                                            },
                                            user: '$user'
                                        },
                                        total: {
                                            $sum: 1
                                        }
                                    }
                                }, {
                                    $lookup: {
                                        from: 'users',
                                        localField: '_id.user',
                                        foreignField: '_id',
                                        as: 'userInfo'
                                    }
                                }, {
                                    $unwind: '$userInfo'
                                }, {
                                    $project: {
                                        '_id.category': 1,
                                        '_id.user': 1,
                                        'total': 1,
                                        'userInfo._id': 1,
                                        'userInfo.firstName': 1,
                                        'userInfo.lastName': 1
                                    }
                                }, {
                                    $group: {
                                        _id: '$_id.category',
                                        users: {
                                            $push: {
                                                user: '$_id.user',
                                                userInfo: '$userInfo',
                                                total: '$total'
                                            }
                                        },
                                        total: { $sum: '$total' }
                                    }
                                }, {
                                    $sort: {
                                        _id: 1
                                    }
                                }
                            ])];
                    case 4:
                        participantSentPerDay = _e.sent();
                        return [4 /*yield*/, car_model_1["default"]
                                .aggregate([
                                {
                                    $match: {
                                        team: team,
                                        destination: { $ne: '' },
                                        createdAt: {
                                            $gte: moment().subtract(30, 'd').toDate()
                                        }
                                    }
                                }, {
                                    $project: {
                                        _id: 1, createdAt: {
                                            $subtract: ['$createdAt', 4 * 60 * 60 * 1000]
                                        }
                                    }
                                }, {
                                    $group: {
                                        _id: {
                                            $dateToString: {
                                                format: '%Y-%m-%d',
                                                date: '$createdAt',
                                                timezone: 'America/Santiago'
                                            }
                                        },
                                        total: {
                                            $sum: 1
                                        }
                                    }
                                }
                            ])];
                    case 5:
                        importCarsPerDay = _e.sent();
                        return [4 /*yield*/, planning_model_1["default"]
                                .aggregate([
                                {
                                    $match: {
                                        team: team,
                                        date: {
                                            $gte: moment().subtract(30, 'd').toDate()
                                        }
                                    }
                                }, {
                                    $project: {
                                        _id: 1,
                                        date: 1
                                    }
                                }, {
                                    $group: {
                                        _id: {
                                            $dateToString: {
                                                format: '%Y-%m-%d',
                                                date: '$date',
                                                timezone: 'America/Santiago'
                                            }
                                        },
                                        total: {
                                            $sum: 1
                                        }
                                    }
                                }
                            ])];
                    case 6:
                        planningPerDay = _e.sent();
                        return [4 /*yield*/, planning_model_1["default"]
                                .find({
                                team: team,
                                date: {
                                    $gte: moment().subtract(30, 'd').toDate()
                                }
                            }, { car: 1, date: 1 })
                                .populate([{
                                    path: 'car',
                                    select: ['vin', 'participants'],
                                    populate: [{
                                            path: 'participants',
                                            select: ['createdAt']
                                        }]
                                }]).lean()];
                    case 7:
                        planningByProcessing = _e.sent();
                        planningByProcessingByKey = {};
                        _loop_2 = function (process_1) {
                            var key = moment(process_1.date).format('YYYY-MM-DD');
                            if (!planningByProcessingByKey.hasOwnProperty(key)) {
                                planningByProcessingByKey[key] = {
                                    total: 0
                                };
                            }
                            var isChecked = process_1.car.participants.filter(function (participant) { return moment(participant.createdAt).format('YYYY-MM-DD') === key; }).length;
                            planningByProcessingByKey[key].total = isChecked ? planningByProcessingByKey[key].total + 1 : planningByProcessingByKey[key].total;
                        };
                        for (_i = 0, planningByProcessing_1 = planningByProcessing; _i < planningByProcessing_1.length; _i++) {
                            process_1 = planningByProcessing_1[_i];
                            _loop_2(process_1);
                        }
                        participantsReceived = [];
                        planning = [];
                        planningProcess = [];
                        participantsSent = [];
                        cars = [];
                        _loop_3 = function (i) {
                            var key = moment().subtract(i, 'd').format('YYYY-MM-DD');
                            var existInplanningPerDay = planningPerDay.find(function (day) { return day._id.toString() === key; });
                            var existInParticipantReceivedPerDay = participantReceivedPerDay.find(function (day) { return day._id.toString() === key; });
                            var existInParticipantSentPerDay = participantSentPerDay.find(function (day) { return day._id.toString() === key; });
                            var existInImportCarsPerDay = importCarsPerDay.find(function (day) { return day._id.toString() === key; });
                            if (!planningByProcessingByKey.hasOwnProperty(key)) {
                                planningProcess.push({
                                    _id: key,
                                    total: 0
                                });
                            }
                            else {
                                planningProcess.push({
                                    id: key,
                                    total: planningByProcessingByKey[key].total
                                });
                            }
                            if (!existInplanningPerDay) {
                                planning.push({
                                    _id: key,
                                    total: 0
                                });
                            }
                            else {
                                planning.push(existInplanningPerDay);
                            }
                            if (!existInParticipantReceivedPerDay) {
                                participantsReceived.push({
                                    _id: key,
                                    users: [],
                                    total: 0
                                });
                            }
                            else {
                                participantsReceived.push(existInParticipantReceivedPerDay);
                            }
                            if (!existInParticipantSentPerDay) {
                                participantsSent.push({
                                    _id: key,
                                    users: [],
                                    total: 0
                                });
                            }
                            else {
                                participantsSent.push(existInParticipantSentPerDay);
                            }
                            if (!existInImportCarsPerDay) {
                                cars.push({
                                    _id: key,
                                    total: 0
                                });
                            }
                            else {
                                cars.push(existInImportCarsPerDay);
                            }
                        };
                        for (i = 29; i >= 0; i--) {
                            _loop_3(i);
                        }
                        proyection = [];
                        proyectionInterval = 5;
                        for (i = 0; i < 100; i += proyectionInterval) {
                            max = i + proyectionInterval;
                            if (i === 0) {
                                proyection.push({
                                    $cond: [{ $and: [{ $gte: ['$qualification', i] }, { $lte: ['$qualification', max] }] }, i + "-" + max, '']
                                });
                            }
                            else {
                                proyection.push({
                                    $cond: [{ $and: [{ $gt: ['$qualification', i] }, { $lte: ['$qualification', max] }] }, i + "-" + max, '']
                                });
                            }
                        }
                        return [4 /*yield*/, participant_model_1["default"]
                                .aggregate([
                                {
                                    $match: {
                                        venue: {
                                            $in: venuesPermissions
                                        },
                                        createdAt: {
                                            $gte: moment().subtract(14, 'd').toDate()
                                        }
                                    }
                                }, {
                                    $project: {
                                        range: {
                                            $concat: __spreadArray([
                                                { $cond: [{ $lt: ['$qualification', 0] }, 'Unknown', ''] }
                                            ], proyection)
                                        }
                                    }
                                }, {
                                    $group: {
                                        _id: '$range',
                                        count: {
                                            $sum: 1
                                        }
                                    }
                                }
                            ])];
                    case 8:
                        participantPerRange = _e.sent();
                        return [4 /*yield*/, venue_model_1["default"].find({ _id: { $in: venuesPermissions } }).populate([{
                                    path: 'company',
                                    select: ['id', 'name']
                                }])];
                    case 9:
                        venues = _e.sent();
                        companiesData = [];
                        companiesIDS = [];
                        for (_a = 0, venues_1 = venues; _a < venues_1.length; _a++) {
                            venue = venues_1[_a];
                            companieID = venue.company.id.toString();
                            if (!companiesIDS.includes(companieID)) {
                                companiesData.push(venue.company);
                                companiesIDS.push(companieID);
                            }
                        }
                        _c = (_b = res).json;
                        _d = {
                            planningPerDay: planningPerDay,
                            carsByVenue: [],
                            companies: companiesData,
                            participantsReceived: participantsReceived,
                            participantsSent: participantsSent,
                            participantPerRange: participantPerRange,
                            planning: planning,
                            planningProcess: planningProcess,
                            cars: cars
                        };
                        return [4 /*yield*/, car_model_1["default"].count({ team: team })];
                    case 10:
                        _c.apply(_b, [(_d.totalCars = _e.sent(),
                                _d.status = 200,
                                _d)]);
                        return [3 /*break*/, 12];
                    case 11:
                        e_6 = _e.sent();
                        /* istanbul ignore next */
                        console.log('e', e_6);
                        /* istanbul ignore next */
                        if (e_6) {
                            res.status(500).json(e_6);
                        }
                        return [3 /*break*/, 12];
                    case 12: return [2 /*return*/];
                }
            });
        });
    };
    CarController.prototype.getHeadersFromForm = function (form) {
        var columns = [];
        for (var _i = 0, _a = form.sections; _i < _a.length; _i++) {
            var section = _a[_i];
            for (var _b = 0, _c = section.questions; _b < _c.length; _b++) {
                var question = _c[_b];
                if (['scale', 'accessory'].includes(question.kind)) {
                    columns.push({
                        header: form.name + " - " + question.question, key: question._id.toString(), width: 30
                    });
                }
                else if (question.kind === 'damage') {
                    columns.push({
                        header: form.name + " - " + question.question, key: question._id.toString(), width: 30, style: {
                            numFmt: '0'
                        }
                    });
                }
            }
        }
        if (form.shippingVenue) {
            columns.push({
                header: form.name + " - " + form.shippingVenueText, key: form._id.toString() + "-shipping", width: 30
            });
        }
        if (form.receptionVenue) {
            columns.push({
                header: form.name + " - " + form.receptionVenueText, key: form._id.toString() + "-reception", width: 30
            });
        }
        return columns;
    };
    CarController.prototype.processAnswer = function (answer) {
        var _a, _b;
        var datum = {};
        if (answer.kind === 'scale' || answer.kind === 'accessory') {
            if (!answer.answer) {
                return {};
            }
            var selectedChoice = answer.scale.choices.find(function (choice) { return choice._id.toString() === answer.answer.toString(); });
            if (selectedChoice) {
                datum = (_a = {}, _a[answer._id.toString()] = selectedChoice.choice, _a);
            }
        }
        else if (answer.kind === 'damage') {
            datum = (_b = {}, _b[answer._id.toString()] = answer.damagesSelected.length, _b);
        }
        return datum;
    };
    CarController.prototype.processParticipant = function (participant) {
        var _a, _b;
        var datum = {
            number: participant.number,
            created_at: moment(participant.createdAt).toDate(),
            model: participant.car ? participant.car.brand + " - " + (participant.car.denomination ? participant.car.denomination : '') + " - " + participant.car.color : '',
            team: participant.team.name,
            user: participant.user ? participant.user.firstName + " " + participant.user.lastName : '',
            company: participant.company.name,
            venue: participant.venue ? participant.venue.name : participant.user ? participant.user.venue.name : '',
            vin: participant.car ? participant.car.vin : '',
            plate: participant.car ? participant.car.patent : '',
            name: participant.name,
            conciliation: participant.conciliation ? 'SI' : 'NO',
            qualification: participant.qualification,
            reception: participant.reception ? 'SI' : 'NO',
            shipping: participant.shipping ? 'SI' : 'NO',
            isReception: participant.receptionText.length > 0 ? 'SI' : 'NO',
            isShipping: participant.shippingText.length > 0 ? 'SI' : 'NO'
        };
        var sectionAnswers = {};
        for (var _i = 0, _c = participant.sections; _i < _c.length; _i++) {
            var section = _c[_i];
            for (var _d = 0, _e = section.answers; _d < _e.length; _d++) {
                var answer = _e[_d];
                sectionAnswers = __assign(__assign({}, sectionAnswers), this.processAnswer(answer));
            }
        }
        if (participant.shippingVenue) {
            sectionAnswers = __assign(__assign({}, sectionAnswers), (_a = {}, _a[participant.form.toString() + "-shipping"] = participant.sendTo.name, _a));
        }
        if (participant.receptionVenue) {
            sectionAnswers = __assign(__assign({}, sectionAnswers), (_b = {}, _b[participant.form.toString() + "-reception"] = participant.receiveFrom.name, _b));
        }
        return __assign(__assign({}, datum), sectionAnswers);
    };
    /* istanbul ignore next */
    CarController.prototype.exportParticipants = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var team, _a, from, to, venuesPermissions, queryFilter, forms, columns, _i, forms_1, form, options, workbook_1, worksheet_1, cursor_1, e_7;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 3, , 4]);
                        team = req.user.team._id;
                        _a = req.query, from = _a.from, to = _a.to;
                        venuesPermissions = req.user.venuesPermissions();
                        queryFilter = {
                            team: team,
                            venue: {
                                $in: venuesPermissions
                            }
                        };
                        if (from && to) {
                            queryFilter.createdAt = {
                                $gte: moment.unix(Number(from)).hour(0).minute(0).toDate(),
                                $lt: moment.unix(Number(to)).hour(23).minute(59).toDate()
                            };
                        }
                        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                        res.setHeader('Content-Disposition', "attachment; filename=revisiones-" + moment().format('YYYY-MM-DD') + ".xlsx");
                        return [4 /*yield*/, participant_model_1["default"].find(queryFilter).distinct('form')];
                    case 1:
                        forms = _b.sent();
                        return [4 /*yield*/, form_model_1["default"].find({ _id: { $in: forms } })];
                    case 2:
                        forms = _b.sent();
                        columns = [{
                                header: '#', key: 'number', width: 30
                            }, {
                                header: 'Fecha', key: 'created_at', width: 30, style: {
                                    numFmt: 'dd/mm/yyyy hh:mm'
                                }
                            }, {
                                header: 'Modelo', key: 'model', width: 30
                            }, {
                                header: 'Team', key: 'team', width: 30
                            }, {
                                header: 'Usuario', key: 'user', width: 30
                            }, {
                                header: 'Compañía', key: 'company', width: 30
                            }, {
                                header: 'Sucursal', key: 'venue', width: 30
                            }, {
                                header: 'VIN', key: 'vin', width: 30
                            }, {
                                header: 'Formulario', key: 'name', width: 30
                            }, {
                                header: 'Tiene conciliación', key: 'conciliation', width: 30
                            }, {
                                header: 'Calificación', key: 'qualification', width: 30, style: {
                                    numFmt: '0.000'
                                }
                            }, {
                                header: 'Tipo Recepción', key: 'isReception', width: 30
                            }, {
                                header: 'Recepcionado', key: 'reception', width: 30
                            }, {
                                header: 'Tipo Envío', key: 'isShipping', width: 30
                            }, {
                                header: 'Enviado', key: 'shipping', width: 30
                            }];
                        // create additional columns/headers based of form questions
                        for (_i = 0, forms_1 = forms; _i < forms_1.length; _i++) {
                            form = forms_1[_i];
                            columns = columns.concat(this.getHeadersFromForm(form));
                        }
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
                        cursor_1 = participant_model_1["default"].find(queryFilter, {
                            number: 1,
                            createdAt: 1,
                            car: 1,
                            team: 1,
                            user: 1,
                            company: 1,
                            venue: 1,
                            name: 1,
                            conciliation: 1,
                            qualification: 1,
                            reception: 1,
                            shipping: 1,
                            receptionText: 1,
                            shippingText: 1,
                            sections: 1,
                            form: 1,
                            shippingVenue: 1,
                            receptionVenue: 1,
                            sendTo: 1,
                            receiveFrom: 1
                        }).populate([{
                                path: 'car',
                                select: 'brand denomination color vin patent'
                            }, {
                                path: 'user',
                                select: 'firstName lastName venue',
                                populate: [{
                                        path: 'venue',
                                        select: 'name'
                                    }]
                            }, {
                                path: 'venue',
                                select: 'name'
                            }, {
                                path: 'company',
                                select: 'name'
                            }, {
                                path: 'team',
                                select: 'name'
                            }, {
                                path: 'sendTo',
                                select: 'name'
                            }, {
                                path: 'receiveFrom',
                                select: 'name'
                            }]).batchSize(100).cursor();
                        cursor_1.on('data', function (participant) { return __awaiter(_this, void 0, void 0, function () {
                            var row;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, this.processParticipant(participant)];
                                    case 1:
                                        row = _a.sent();
                                        return [4 /*yield*/, worksheet_1.addRow(row).commit()];
                                    case 2:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
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
                        e_7 = _b.sent();
                        logger_service_1["default"].error(e_7);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    CarController.prototype.apiParticipantDetail = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var id, team, venuesPermissions, participant, e_8;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        id = req.params.id;
                        team = req.user.team._id;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        venuesPermissions = req.user.venuesPermissions();
                        return [4 /*yield*/, participant_model_1["default"]
                                .findOne({
                                _id: id,
                                team: team,
                                $or: [{
                                        venue: {
                                            $in: venuesPermissions
                                        }
                                    }, {
                                        venue: {
                                            $exists: false
                                        }
                                    }, {
                                        venue: null
                                    }]
                            }, {
                                name: true,
                                user: true,
                                sections: true,
                                qualification: true,
                                shipping: true,
                                shippingConfirmation: true,
                                shippingText: true,
                                shippingImages: true,
                                reception: true,
                                receptionConfirmation: true,
                                receptionText: true,
                                receptionImages: true,
                                carrier: true,
                                carrierText: true,
                                carrierBy: true,
                                conciliation: true,
                                conciliationText: true,
                                receiveFrom: true,
                                receptionVenueText: true,
                                sendTo: true,
                                shippingVenueText: true,
                                conciliationImages: true,
                                createdAt: true
                            })
                                .populate([{
                                    path: 'carrierBy',
                                    select: ['name']
                                }, {
                                    path: 'receiveFrom',
                                    select: ['name']
                                }, {
                                    path: 'sendTo',
                                    select: ['name']
                                }, {
                                    path: 'user',
                                    select: ['firstName', 'lastName']
                                }, {
                                    path: 'sections.answers.images'
                                }, {
                                    path: 'sections.answers.damagesSelected.images'
                                }, {
                                    path: 'shippingImages'
                                }, {
                                    path: 'receptionImages'
                                }, {
                                    path: 'conciliationImages'
                                }])];
                    case 2:
                        participant = _a.sent();
                        // validate exist participant
                        if (!participant) {
                            res.status(404).json({
                                messsage: 'Formulario no encontrado.',
                                status: 404
                            });
                        }
                        else {
                            res.json({
                                data: participant,
                                status: 200
                            });
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        e_8 = _a.sent();
                        /* istanbul ignore next */
                        if (e_8) {
                            res.status(500).json(e_8);
                        }
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    CarController.prototype.apiCarDetail = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var team, id, venuesPermissions, car, _a, _b, e_9;
            var _c, _d, _e;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        team = req.user.team._id;
                        id = req.params.id;
                        _f.label = 1;
                    case 1:
                        _f.trys.push([1, 4, , 5]);
                        venuesPermissions = req.user.venuesPermissions();
                        _b = (_a = car_model_1["default"]
                            .findOne({
                            _id: id,
                            team: team
                        }, {
                            vin: true,
                            brand: true,
                            internalNumber: true,
                            createdAt: true,
                            patent: true,
                            denomination: true,
                            color: true
                        }))
                            .populate;
                        _c = {
                            path: 'inventories'
                        };
                        _d = {};
                        _e = {};
                        return [4 /*yield*/, inventory_model_1["default"].find({
                                team: team,
                                venues: {
                                    $in: venuesPermissions
                                },
                                status: inventory_model_1.ChoicesStatusInventory.finalized
                            }, {
                                _id: true
                            })];
                    case 2: return [4 /*yield*/, _b.apply(_a, [[(_c.match = (_d.inventory = (_e.$in = _f.sent(),
                                    _e),
                                    _d.status = {
                                        $in: [
                                            inventoryCar_model_1.ChoicesStatusCarInventory.pending,
                                            inventoryCar_model_1.ChoicesStatusCarInventory.found,
                                            inventoryCar_model_1.ChoicesStatusCarInventory.missing,
                                            inventoryCar_model_1.ChoicesStatusCarInventory.leftover,
                                            inventoryCar_model_1.ChoicesStatusCarInventory.reported
                                        ]
                                    },
                                    _d.$or = [{
                                            venue: {
                                                $in: venuesPermissions
                                            }
                                        }, {
                                            venueFound: {
                                                $in: venuesPermissions
                                            }
                                        }],
                                    _d),
                                    _c.populate = [{
                                            path: 'venue',
                                            select: ['name']
                                        }, {
                                            path: 'label'
                                        }, {
                                            path: 'venueFound',
                                            select: ['name']
                                        }, {
                                            path: 'inventory',
                                            select: ['name']
                                        }, {
                                            path: 'inventoriedBy',
                                            select: ['firstName', 'lastName']
                                        }, {
                                            path: 'labelBy',
                                            select: ['firstName', 'lastName']
                                        }],
                                    _c.options = {
                                        sort: {
                                            createdAt: -1
                                        }
                                    },
                                    _c), {
                                    // reverse populate
                                    path: 'participants',
                                    select: ['number', 'name', 'user', 'createdAt', 'updatedAt', 'qualification', 'venue', 'shipping', 'reception', 'hasDamages'],
                                    match: {
                                        $or: [{
                                                venue: {
                                                    $in: venuesPermissions
                                                }
                                            }, {
                                                venue: {
                                                    $exists: false
                                                }
                                            }, {
                                                venue: null
                                            }]
                                    },
                                    options: {
                                        sort: {
                                            createdAt: -1
                                        }
                                    },
                                    // deep populate user
                                    populate: [{
                                            path: 'venue',
                                            select: ['name']
                                        }, {
                                            path: 'form',
                                            select: ['shipping', 'reception']
                                        }, {
                                            path: 'user',
                                            select: ['firstName', 'lastName']
                                        }]
                                }]]).lean()];
                    case 3:
                        car = _f.sent();
                        if (!car) {
                            res.status(404).json({
                                messsage: 'Auto no encontrado.',
                                status: 404
                            });
                        }
                        else {
                            res.json({
                                data: car,
                                status: 200
                            });
                        }
                        return [3 /*break*/, 5];
                    case 4:
                        e_9 = _f.sent();
                        /* istanbul ignore next */
                        if (e_9) {
                            res.status(500).json(e_9);
                        }
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    CarController.prototype.apiRevisions = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, page, pageSize, search, from, to, team, options, participantFilter, searchText, searchUser, searchVenue, searchCar, createdAtFilter, revisions, e_10;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = req.query, page = _a.page, pageSize = _a.pageSize, search = _a.search, from = _a.from, to = _a.to;
                        team = req.user.team._id;
                        options = {
                            select: {
                                createdAt: true,
                                number: true,
                                car: true,
                                venue: true,
                                user: true,
                                hasDamages: true,
                                qualification: true,
                                name: true
                            },
                            populate: [{
                                    path: 'car',
                                    select: ['vin', 'brand', 'patent', 'denomination', 'color', 'lastForm'],
                                    populate: {
                                        path: 'lastForm',
                                        select: ['createdAt']
                                    }
                                }, {
                                    path: 'user',
                                    select: ['firstName', 'lastName']
                                }, {
                                    path: 'venue',
                                    select: ['name']
                                }],
                            sort: {
                                _id: -1
                            },
                            page: parseInt(page ? page : '1', 10),
                            limit: parseInt(pageSize ? pageSize : '20', 10)
                        };
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 9, , 10]);
                        participantFilter = {
                            $and: [{
                                    venue: {
                                        $in: req.user.venuesPermissions()
                                    },
                                    team: team
                                }]
                        };
                        if (!(search && search.length)) return [3 /*break*/, 7];
                        searchText = new RegExp(search, 'i');
                        return [4 /*yield*/, user_model_1["default"].find({
                                $and: [{
                                        $or: [{
                                                firstName: { $regex: searchText }
                                            }, {
                                                lastName: { $regex: searchText }
                                            }]
                                    }, { team: team }]
                            }, { _id: true })];
                    case 2:
                        searchUser = _b.sent();
                        return [4 /*yield*/, venue_model_1["default"].find({
                                _id: {
                                    $in: req.user.venuesPermissions()
                                },
                                name: {
                                    $regex: searchText
                                },
                                team: team
                            }, { _id: true })];
                    case 3:
                        searchVenue = _b.sent();
                        if (!searchUser.length) return [3 /*break*/, 4];
                        participantFilter.$and.push({
                            user: {
                                $in: searchUser
                            }
                        });
                        return [3 /*break*/, 7];
                    case 4:
                        if (!searchVenue.length) return [3 /*break*/, 5];
                        participantFilter.$and.push({
                            venue: {
                                $in: searchVenue
                            }
                        });
                        return [3 /*break*/, 7];
                    case 5: return [4 /*yield*/, car_model_1["default"].find({
                            $or: [{
                                    vin: {
                                        $regex: searchText
                                    }
                                }, {
                                    patent: {
                                        $regex: searchText
                                    }
                                }, {
                                    brand: {
                                        $regex: searchText
                                    }
                                }],
                            team: team
                        }, { _id: true })];
                    case 6:
                        searchCar = _b.sent();
                        participantFilter.$and.push({
                            car: {
                                $in: searchCar
                            }
                        });
                        _b.label = 7;
                    case 7:
                        if (from || to) {
                            createdAtFilter = {};
                            if (from) {
                                createdAtFilter.$gte = moment(from, 'YYYY-MM-DD').startOf('day');
                            }
                            if (to) {
                                createdAtFilter.$lte = moment(to, 'YYYY-MM-DD').endOf('day');
                            }
                            participantFilter.$and.push({
                                createdAt: createdAtFilter
                            });
                        }
                        console.log(participantFilter);
                        return [4 /*yield*/, this.getRevisions(participantFilter, options)];
                    case 8:
                        revisions = _b.sent();
                        // validate exist page
                        if (options.page && revisions.pages && revisions.pages < options.page) {
                            res.status(400).json({
                                message: 'La página solicitada no existe.',
                                status: 200
                            });
                        }
                        else {
                            res.json({
                                count: revisions.total,
                                pages: revisions.pages,
                                hasPrevious: options.page && options.page > 1 && revisions.pages && revisions.pages >= options.page,
                                hasNext: options.page && revisions.pages && revisions.pages > options.page,
                                results: revisions.docs,
                                status: 200
                            });
                        }
                        return [3 /*break*/, 10];
                    case 9:
                        e_10 = _b.sent();
                        /* istanbul ignore next */
                        console.log(e_10);
                        if (e_10) {
                            res.status(500).json(e_10);
                        }
                        return [3 /*break*/, 10];
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    CarController.prototype.processDamagedCar = function (cache, participant, extraColums) {
        var _this = this;
        return new Promise(function (resolve) { return __awaiter(_this, void 0, void 0, function () {
            var rows, damages, extraRow, _i, _a, section, _b, _c, answer, answerID, _loop_4, _d, _e, damage, d, idx, row, row;
            var _f;
            return __generator(this, function (_g) {
                rows = [];
                damages = [];
                extraRow = {};
                for (_i = 0, _a = participant.sections; _i < _a.length; _i++) {
                    section = _a[_i];
                    for (_b = 0, _c = section.answers; _b < _c.length; _b++) {
                        answer = _c[_b];
                        if (answer.kind === form_model_1.KindQuestion.text || (answer.comment && answer.comment.length)) {
                            answerID = answer._id.toString();
                            if (!extraColums.keys.includes(answerID)) {
                                extraColums.keys.push(answerID);
                                extraColums.data.push({
                                    header: answer.question, key: answerID, width: 50
                                });
                            }
                            extraRow = __assign(__assign({}, extraRow), (_f = {}, _f[answerID] = answer.comment, _f));
                        }
                        _loop_4 = function (damage) {
                            var kind = damage.kind && cache.kinds.hasOwnProperty(damage.kind.toString())
                                ? cache.kinds[damage.kind.toString()]
                                : answer.damages.kinds
                                    .find(function (d) {
                                    return Boolean(d._id && damage.kind && d._id.toString() === damage.kind.toString());
                                });
                            var part = damage.part && cache.parts.hasOwnProperty(damage.part.toString())
                                ? cache.parts[damage.part.toString()]
                                : answer.damages.parts
                                    .find(function (d) {
                                    return Boolean(d._id && damage.part && d._id.toString() === damage.part.toString());
                                });
                            var position = damage.position && cache.positions.hasOwnProperty(damage.position.toString())
                                ? cache.positions[damage.position.toString()]
                                : answer.damages.positions
                                    .find(function (d) {
                                    return Boolean(d._id && damage.position && d._id.toString() === damage.position.toString());
                                });
                            if (kind && part) {
                                damages.push({ kind: kind, part: part, position: position });
                            }
                        };
                        for (_d = 0, _e = answer.damagesSelected; _d < _e.length; _d++) {
                            damage = _e[_d];
                            _loop_4(damage);
                        }
                    }
                }
                if (damages.length) {
                    // tslint:disable-next-line: forin
                    for (d in damages) {
                        idx = parseInt(d, 10) + 1;
                        row = __assign({ vin: participant.car.vin, denomination: participant.car.denomination, color: participant.car.color, brand: participant.car.brand, venue: participant.venue.name, created_at: moment(participant.createdAt).toDate(), user: participant.user.firstName + " " + participant.user.lastName, damages: "" + damages.length, has_damages: damages.length > 0 ? 'Sí' : 'No', damage: idx, position: damages[d].position ? damages[d].position.name : '-', kind: damages[d].kind.name, part: damages[d].part.name }, extraRow);
                        rows.push(row);
                    }
                }
                else {
                    row = __assign({ vin: participant.car.vin, denomination: participant.car.denomination, color: participant.car.color, brand: participant.car.brand, venue: participant.venue.name, created_at: moment(participant.createdAt).toDate(), user: participant.user.firstName + " " + participant.user.lastName, damages: "" + damages.length, has_damages: damages.length > 0 ? 'Sí' : 'No', damage: '-', position: '-', kind: '-', part: '-' }, extraRow);
                    rows.push(row);
                }
                resolve(rows);
                return [2 /*return*/];
            });
        }); });
    };
    CarController.prototype.addRevisions = function (user, period, damagesCache, extraColums) {
        var _this = this;
        return new Promise(function (resolve) { return __awaiter(_this, void 0, void 0, function () {
            var revisionsToProcess, t0, t1, revisions, _i, revisions_1, revision, results, data, _a, _b, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        revisionsToProcess = [];
                        t0 = moment().subtract(period, 'weeks').startOf('week');
                        t1 = moment().subtract(period, 'weeks').endOf('week');
                        return [4 /*yield*/, participant_model_1["default"].aggregate([{
                                    $match: {
                                        $and: [
                                            {
                                                venue: {
                                                    $in: user.venuesPermissions()
                                                }
                                            }, {
                                                createdAt: {
                                                    $gte: t0.toDate(),
                                                    $lte: t1.toDate()
                                                }
                                            } /*,{
                                              'sections.answers.kind': 'damage'
                                            }*/
                                        ]
                                    }
                                }, {
                                    $project: {
                                        createdAt: true,
                                        user: true,
                                        venue: true,
                                        car: true,
                                        'sections.answers._id': true,
                                        'sections.answers.kind': true,
                                        'sections.answers.question': true,
                                        'sections.answers.comment': true,
                                        'sections.answers.damages': true,
                                        'sections.answers.damagesSelected': true
                                    }
                                }, {
                                    $lookup: {
                                        from: 'users',
                                        localField: 'user',
                                        foreignField: '_id',
                                        as: 'user'
                                    }
                                }, {
                                    $unwind: '$user'
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
                                }])];
                    case 1:
                        revisions = _d.sent();
                        for (_i = 0, revisions_1 = revisions; _i < revisions_1.length; _i++) {
                            revision = revisions_1[_i];
                            revisionsToProcess.push(this.processDamagedCar(damagesCache, revision, extraColums));
                        }
                        results = [];
                        _d.label = 2;
                    case 2:
                        if (!revisionsToProcess.length) return [3 /*break*/, 4];
                        _b = (_a = [].concat).apply;
                        _c = [[]];
                        return [4 /*yield*/, bluebird.all(revisionsToProcess.splice(0, 100))];
                    case 3:
                        data = _b.apply(_a, _c.concat([_d.sent()]));
                        results = __spreadArray(__spreadArray([], results), data);
                        return [3 /*break*/, 2];
                    case 4:
                        resolve(results);
                        return [2 /*return*/];
                }
            });
        }); });
    };
    CarController.prototype.apiDamagesExport = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var team, changeperiods, workbook, worksheet, extraColums, columns, periods, kinds, parts, positions, damagesCache, periodToProcess, i, newColumns, rows, _i, rows_1, row, e_11;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!req.user.hasPermission('exportDamages')) {
                            return [2 /*return*/, res.status(403).json({
                                    message: 'No tienes permisos para esta operación'
                                })];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 9, , 10]);
                        team = req.user.team._id;
                        changeperiods = req.query.changeperiods;
                        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                        res.setHeader('Content-Disposition', "attachment; filename=da\u00F1os-" + moment().format('YYYY-MM-DD') + ".xlsx");
                        workbook = new excel.stream.xlsx.WorkbookWriter({
                            stream: res,
                            useStyles: true,
                            useSharedStrings: true
                        });
                        worksheet = workbook.addWorksheet('Daños', {
                            properties: {
                                defaultRowHeight: 30
                            }, pageSetup: {
                                fitToPage: true, fitToHeight: 100, fitToWidth: 1
                            }
                        });
                        extraColums = {
                            keys: [],
                            data: []
                        };
                        columns = [{
                                header: 'VIN', key: 'vin', width: 30
                            }, {
                                header: 'Denominación', key: 'denomination', width: 30
                            }, {
                                header: 'Color', key: 'color', width: 30
                            }, {
                                header: 'Marca', key: 'brand', width: 30
                            }, {
                                header: 'Sucursal', key: 'venue', width: 30
                            }, {
                                header: 'Fecha', key: 'created_at', width: 30, style: {
                                    numFmt: 'dd/mm/yyyy hh:mm'
                                }
                            }, {
                                header: 'Usuario', key: 'user', width: 30
                            }, {
                                header: 'Tiene daños', key: 'has_damages', width: 30
                            }, {
                                header: 'Daños reportados', key: 'damages', width: 30
                            }];
                        columns.push({ header: 'Daño', key: 'damage', width: 30 });
                        columns.push({ header: 'Parte', key: 'part', width: 30 });
                        columns.push({ header: 'Tipo', key: 'kind', width: 30 });
                        columns.push({ header: 'Posición', key: 'position', width: 30 });
                        periods = changeperiods ? parseInt(changeperiods, 10) : 8;
                        return [4 /*yield*/, kind_model_1["default"].find({ team: team }, { name: true })];
                    case 2:
                        kinds = _a.sent();
                        return [4 /*yield*/, part_model_1["default"].find({ team: team }, { name: true })];
                    case 3:
                        parts = _a.sent();
                        return [4 /*yield*/, position_model_1["default"].find({ team: team }, { name: true })];
                    case 4:
                        positions = _a.sent();
                        damagesCache = {
                            kinds: kinds.reduce(function (acc, cur) {
                                acc[cur._id.toString()] = cur;
                                return acc;
                            }, {}),
                            parts: parts.reduce(function (acc, cur) {
                                acc[cur._id.toString()] = cur;
                                return acc;
                            }, {}),
                            positions: positions.reduce(function (acc, cur) {
                                acc[cur._id.toString()] = cur;
                                return acc;
                            }, {})
                        };
                        periodToProcess = [];
                        for (i = periods; i >= 0; i--) {
                            periodToProcess.push(this.addRevisions(req.user, i, damagesCache, extraColums));
                        }
                        newColumns = __spreadArray(__spreadArray([], columns), extraColums.data);
                        worksheet.columns = newColumns;
                        worksheet.autoFilter = { from: 'A1', to: { row: 1, column: newColumns.length } };
                        _a.label = 5;
                    case 5:
                        if (!periodToProcess.length) return [3 /*break*/, 7];
                        return [4 /*yield*/, periodToProcess.splice(0, 1)[0]];
                    case 6:
                        rows = _a.sent();
                        for (_i = 0, rows_1 = rows; _i < rows_1.length; _i++) {
                            row = rows_1[_i];
                            worksheet.addRow(row).commit();
                        }
                        return [3 /*break*/, 5];
                    case 7: return [4 /*yield*/, workbook.commit()];
                    case 8:
                        _a.sent();
                        res.status(200);
                        return [3 /*break*/, 10];
                    case 9:
                        e_11 = _a.sent();
                        /* istanbul ignore next */
                        if (e_11) {
                            console.log(e_11);
                            res.status(500).json(e_11);
                        }
                        return [3 /*break*/, 10];
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    CarController.prototype.apiRotationExport = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var team, workbook, worksheet, i, ti, tf, cars, _i, cars_1, car, inventories, n, inv0, inv1, t0, t1, row, tempFilePath, e_12;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!req.user.hasPermission('exportRotation')) {
                            return [2 /*return*/, res.status(403).json({
                                    message: 'No tienes permisos para esta operación'
                                })];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 6, , 7]);
                        team = req.user.team._id;
                        workbook = new excel.Workbook();
                        worksheet = workbook.addWorksheet('Rotación de unidades', {
                            properties: {
                                defaultRowHeight: 30
                            }, pageSetup: {
                                fitToPage: true, fitToHeight: 100, fitToWidth: 1
                            }
                        });
                        worksheet.autoFilter = { from: 'A1', to: 'F1' };
                        worksheet.columns = [{
                                header: 'VIN', key: 'vin', width: 30
                            }, {
                                header: 'Denominación', key: 'denomination', width: 30
                            }, {
                                header: 'Color', key: 'color', width: 30
                            }, {
                                header: 'Marca', key: 'brand', width: 30
                            }, {
                                header: 'Sucursal entrada', key: 'v0', width: 30
                            }, {
                                header: 'Tiempo inicio', key: 't0', width: 30
                            }, {
                                header: 'Sucursal salida', key: 'v1', width: 30
                            }, {
                                header: 'Tiempo fin', key: 't1', width: 30
                            }, {
                                header: 'Inventarios', key: 'inventories', width: 30
                            }, {
                                header: 'Rotación', key: 'rotation', width: 30
                            }];
                        i = 12;
                        _a.label = 2;
                    case 2:
                        if (!(--i > 0)) return [3 /*break*/, 4];
                        ti = moment().subtract(i * 15, 'day');
                        tf = moment().subtract((i - 1) * 15, 'day');
                        console.log(ti.format('YYYY-MM-DD'), tf.format('YYYY-MM-DD'));
                        return [4 /*yield*/, car_model_1["default"].find({
                                team: team,
                                isExhibition: false,
                                lastForm: {
                                    $exists: true
                                },
                                createdAt: {
                                    $gte: ti,
                                    $lte: tf
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
                                },
                                populate: {
                                    path: 'venueFound',
                                    select: ['name']
                                }
                            })];
                    case 3:
                        cars = _a.sent();
                        for (_i = 0, cars_1 = cars; _i < cars_1.length; _i++) {
                            car = cars_1[_i];
                            inventories = car.inventories;
                            if (inventories.length === 0) {
                                continue;
                            }
                            n = inventories.length;
                            inv0 = inventories[0];
                            inv1 = inventories[n - 1];
                            t0 = inv0.createdAt;
                            t1 = inv1.createdAt;
                            row = {
                                vin: car.vin,
                                denomination: car.denomination,
                                color: car.color,
                                brand: car.brand,
                                v0: inv0.venueFound ? inv0.venueFound.name : inv0.venue.name,
                                t0: t0,
                                v1: inv1.venueFound ? inv1.venueFound.name : inv1.venue.name,
                                t1: t1,
                                inventories: n,
                                rotation: moment(t1).diff(moment(t0), 'days', true)
                            };
                            worksheet.addRow(row);
                        }
                        return [3 /*break*/, 2];
                    case 4:
                        tempFilePath = tempfile('.xlsx');
                        return [4 /*yield*/, workbook.xlsx.writeFile(tempFilePath)];
                    case 5:
                        _a.sent();
                        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                        res.setHeader('Content-Disposition', 'attachment; filename=usuarios-21-03-2019.xlsx');
                        return [2 /*return*/, res.sendFile(tempFilePath)];
                    case 6:
                        e_12 = _a.sent();
                        /* istanbul ignore next */
                        if (e_12) {
                            console.log(e_12);
                            res.status(500).json(e_12);
                        }
                        return [3 /*break*/, 7];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    CarController.prototype.apiCars = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, page, pageSize, search, options, cars, _b, e_13;
            var _c, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        _a = req.query, page = _a.page, pageSize = _a.pageSize, search = _a.search;
                        options = {
                            select: {
                                vin: true,
                                brand: true,
                                denomination: true,
                                color: true
                            },
                            populate: [{
                                    path: 'lastForm',
                                    select: ['createdAt', 'user', 'qualification', 'venue'],
                                    populate: [{
                                            path: 'user',
                                            select: ['firstName', 'lastName']
                                        }, {
                                            path: 'venue',
                                            select: ['name']
                                        }]
                                }],
                            sort: {
                                updatedAt: -1
                            },
                            page: parseInt(page ? page : '1', 10),
                            limit: parseInt(pageSize ? pageSize : '20', 10)
                        };
                        _e.label = 1;
                    case 1:
                        _e.trys.push([1, 4, , 5]);
                        _b = this.getCars;
                        _c = {};
                        _d = {
                            $exists: true,
                            $ne: null
                        };
                        return [4 /*yield*/, participant_model_1["default"].find({
                                venue: {
                                    $in: req.user.venuesPermissions()
                                }
                            }, { _id: true })];
                    case 2: return [4 /*yield*/, _b.apply(this, [(_c.lastForm = (_d.$in = _e.sent(),
                                _d),
                                _c), options, search])];
                    case 3:
                        cars = _e.sent();
                        // validate exist page
                        if (options.page && cars.pages && cars.pages < options.page) {
                            res.status(400).json({
                                message: 'La página solicitada no existe.',
                                status: 200
                            });
                        }
                        else {
                            res.json({
                                count: cars.total,
                                pages: cars.pages,
                                hasPrevious: options.page && options.page > 1 && cars.pages && cars.pages >= options.page,
                                hasNext: options.page && cars.pages && cars.pages > options.page,
                                results: cars.docs,
                                status: 200
                            });
                        }
                        return [3 /*break*/, 5];
                    case 4:
                        e_13 = _e.sent();
                        /* istanbul ignore next */
                        if (e_13) {
                            res.status(500).json(e_13);
                        }
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    CarController.prototype.getRevisions = function (filters, options) {
        return new Promise(function (resolve, reject) {
            participant_model_1["default"].paginate(filters, options, function (err, result) {
                if (err) {
                    /* istanbul ignore next */
                    reject(err);
                }
                resolve(result);
            });
        });
    };
    CarController.prototype.getCars = function (filters, options, search) {
        var filter = __assign({}, filters);
        if (search && search.length) {
            var searchText = new RegExp(search, 'i');
            // search in vin and brand
            filter = {
                $and: [{
                        $or: [{
                                vin: {
                                    $regex: searchText
                                }
                            }, {
                                brand: {
                                    $regex: searchText
                                }
                            }]
                    }, filter]
            };
        }
        return new Promise(function (resolve, reject) {
            car_model_1["default"].paginate(filter, options, function (err, result) {
                if (err) {
                    /* istanbul ignore next */
                    return reject(err);
                }
                return resolve(result);
            });
        });
    };
    CarController.prototype.apiVenueRevisionStats = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var team, _a, from, to, venuesPermissions, queryFilter, activeVenues_1, inactiveVenues, allVenues, e_14;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 3, , 4]);
                        team = req.user.team._id;
                        _a = req.query, from = _a.from, to = _a.to;
                        venuesPermissions = req.user.venuesPermissions();
                        queryFilter = {
                            team: team,
                            venue: {
                                $in: venuesPermissions
                            }
                        };
                        if (from && to) {
                            queryFilter.createdAt = {
                                $gte: moment.unix(Number(from)).hour(0).minute(0).toDate(),
                                $lt: moment.unix(Number(to)).hour(23).minute(59).toDate()
                            };
                        }
                        return [4 /*yield*/, participant_model_1["default"].aggregate([
                                {
                                    $match: queryFilter
                                }, {
                                    $lookup: {
                                        from: 'venues',
                                        localField: 'venue',
                                        foreignField: '_id',
                                        as: '_venue'
                                    }
                                }, {
                                    $unwind: "$_venue"
                                }, {
                                    $group: {
                                        _id: "$_venue._id",
                                        name: { $first: "$_venue.name" },
                                        total: { $sum: 1 }
                                    }
                                }
                            ])];
                    case 1:
                        activeVenues_1 = _b.sent();
                        return [4 /*yield*/, venue_model_1["default"].find({
                                team: team,
                                _id: {
                                    $in: venuesPermissions.filter(function (vp) { return !activeVenues_1.some(function (v) { return v._id.toString() === vp.toString(); }); })
                                }
                            }, { name: 1, _id: 1 })];
                    case 2:
                        inactiveVenues = _b.sent();
                        allVenues = activeVenues_1.concat(inactiveVenues);
                        res.status(200).json(allVenues);
                        return [3 /*break*/, 4];
                    case 3:
                        e_14 = _b.sent();
                        logger_service_1["default"].error(e_14);
                        res.status(500).json(e_14);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    CarController.prototype.apiRevisionStats = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var team, venuesPermissions, queryFilter, todayParticipants, yesterdayParticipants, lastMonthParticipants, currentMonthParticipants, totalParticipants, sentStats, receivedStats, activeVenues_2, inactiveVenues, e_15;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 10, , 11]);
                        team = req.user.team._id;
                        venuesPermissions = req.user.venuesPermissions();
                        queryFilter = {
                            team: team,
                            venue: {
                                $in: venuesPermissions
                            }
                        };
                        return [4 /*yield*/, participant_model_1["default"].count(__assign(__assign({}, queryFilter), { createdAt: {
                                    $gte: moment().hour(0).minute(0).toDate(),
                                    $lt: moment().hour(23).minute(59).toDate()
                                } }))];
                    case 1:
                        todayParticipants = _a.sent();
                        return [4 /*yield*/, participant_model_1["default"].count(__assign(__assign({}, queryFilter), { createdAt: {
                                    $gte: moment().subtract(1, "day").startOf("day").toDate(),
                                    $lt: moment().subtract(1, "day").endOf("day").toDate()
                                } }))];
                    case 2:
                        yesterdayParticipants = _a.sent();
                        return [4 /*yield*/, participant_model_1["default"].count(__assign(__assign({}, queryFilter), { createdAt: {
                                    $gte: moment().subtract(1, "month").startOf("month").toDate(),
                                    $lt: moment().subtract(1, "month").endOf("month").toDate()
                                } }))];
                    case 3:
                        lastMonthParticipants = _a.sent();
                        return [4 /*yield*/, participant_model_1["default"].count(__assign(__assign({}, queryFilter), { createdAt: {
                                    $gte: moment().startOf("month").toDate(),
                                    $lt: moment().endOf("month").toDate()
                                } }))];
                    case 4:
                        currentMonthParticipants = _a.sent();
                        return [4 /*yield*/, participant_model_1["default"].count(queryFilter)];
                    case 5:
                        totalParticipants = _a.sent();
                        return [4 /*yield*/, participant_model_1["default"].aggregate([
                                {
                                    $match: __assign(__assign({}, queryFilter), { shipping: true })
                                }, {
                                    $group: {
                                        _id: 1,
                                        accepted: { $sum: { $cond: [{ $eq: ["$shippingConfirmation", true] }, 1, 0] } },
                                        rejected: { $sum: { $cond: [{ $eq: ["$shippingConfirmation", false] }, 1, 0] } }
                                    }
                                }
                            ])];
                    case 6:
                        sentStats = _a.sent();
                        return [4 /*yield*/, participant_model_1["default"].aggregate([
                                {
                                    $match: __assign(__assign({}, queryFilter), { reception: true })
                                }, {
                                    $group: {
                                        _id: 1,
                                        accepted: { $sum: { $cond: [{ $eq: ["$receptionConfirmation", true] }, 1, 0] } },
                                        rejected: { $sum: { $cond: [{ $eq: ["$receptionConfirmation", false] }, 1, 0] } }
                                    }
                                }
                            ])];
                    case 7:
                        receivedStats = _a.sent();
                        return [4 /*yield*/, participant_model_1["default"].aggregate([
                                {
                                    $match: __assign(__assign({}, queryFilter), { createdAt: {
                                            $gte: moment().startOf("month").toDate(),
                                            $lt: moment().endOf("month").toDate()
                                        } })
                                }, {
                                    $group: {
                                        _id: "$venue",
                                        total: { $sum: 1 }
                                    }
                                }
                            ])];
                    case 8:
                        activeVenues_2 = _a.sent();
                        return [4 /*yield*/, venue_model_1["default"].find({
                                team: team,
                                _id: {
                                    $in: venuesPermissions.filter(function (vp) { return !activeVenues_2.some(function (v) { return v._id.toString() === vp.toString(); }); })
                                }
                            }, { name: 1, _id: 1 })];
                    case 9:
                        inactiveVenues = _a.sent();
                        res.status(200).json({
                            revisions: {
                                today: todayParticipants,
                                yesterday: yesterdayParticipants,
                                lastMonthTotal: lastMonthParticipants,
                                currentMonthTotal: currentMonthParticipants,
                                totalRevisions: totalParticipants,
                                sentStats: sentStats[0],
                                receivedStats: receivedStats[0]
                            },
                            venues: {
                                activeVenues: activeVenues_2.length,
                                inactiveVenues: inactiveVenues.length
                            }
                        });
                        return [3 /*break*/, 11];
                    case 10:
                        e_15 = _a.sent();
                        logger_service_1["default"].error(e_15);
                        res.status(500).json(e_15);
                        return [3 /*break*/, 11];
                    case 11: return [2 /*return*/];
                }
            });
        });
    };
    return CarController;
}());
exports["default"] = new CarController();
//# sourceMappingURL=car.controller.js.map