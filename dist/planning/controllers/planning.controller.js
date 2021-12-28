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
var planning_model_1 = require("../models/planning.model");
var moment = require("moment");
var car_model_1 = require("../../app/models/car.model");
var server_1 = require("../../server");
var PlanningController = /** @class */ (function () {
    function PlanningController() {
        this.index = this.index.bind(this);
        this.list = this.list.bind(this);
        this.create = this.create.bind(this);
        this.getPlanning = this.getPlanning.bind(this);
    }
    /* istanbul ignore next */
    PlanningController.prototype.index = function (req, res) {
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
    PlanningController.prototype.create = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var company, team, carsByDate, planningCars, _i, carsByDate_1, item, _a, _b, car, currentCar, e_2;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        company = req.user.company;
                        team = req.user.team._id;
                        carsByDate = req.body.carsByDate;
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 11, , 12]);
                        planningCars = [];
                        _i = 0, carsByDate_1 = carsByDate;
                        _c.label = 2;
                    case 2:
                        if (!(_i < carsByDate_1.length)) return [3 /*break*/, 9];
                        item = carsByDate_1[_i];
                        _a = 0, _b = item.cars;
                        _c.label = 3;
                    case 3:
                        if (!(_a < _b.length)) return [3 /*break*/, 8];
                        car = _b[_a];
                        return [4 /*yield*/, car_model_1["default"].findOne({
                                team: team,
                                vin: car.vin.trim()
                            })];
                    case 4:
                        currentCar = _c.sent();
                        if (!(currentCar === null && car.vin && car.vin.trim().length)) return [3 /*break*/, 6];
                        currentCar = new car_model_1["default"]({
                            team: team,
                            company: company,
                            internalNumber: car.NInterno,
                            vin: car.vin,
                            vin2: car.vin.substr(car.vin.length - 6),
                            color: car.color,
                            type: car.tipo,
                            property: car.propiedad,
                            denomination: car.denominacion,
                            brand: car.marca,
                            patent: car.patente,
                            createdBy: req.user,
                            status: car_model_1.ChoicesStatusCar.active
                        });
                        return [4 /*yield*/, currentCar.save()];
                    case 5:
                        _c.sent();
                        _c.label = 6;
                    case 6:
                        if (currentCar) {
                            planningCars.push({
                                team: team,
                                company: company,
                                car: currentCar._id,
                                createdBy: req.user,
                                date: moment(item.key, "YYYYMMDD").toDate()
                            });
                        }
                        _c.label = 7;
                    case 7:
                        _a++;
                        return [3 /*break*/, 3];
                    case 8:
                        _i++;
                        return [3 /*break*/, 2];
                    case 9: return [4 /*yield*/, planning_model_1["default"].insertMany(planningCars)];
                    case 10:
                        _c.sent();
                        server_1.io.to("planning-list-".concat(team)).emit('REFRESH', {
                            update: true
                        });
                        res.status(201)
                            .json({
                            message: 'Planificación importada satisfactoriamente',
                            status: 201
                        });
                        return [3 /*break*/, 12];
                    case 11:
                        e_2 = _c.sent();
                        /* istanbul ignore next */
                        if (e_2) {
                            console.log(e_2);
                            res.status(500).json(e_2);
                        }
                        return [3 /*break*/, 12];
                    case 12: return [2 /*return*/];
                }
            });
        });
    };
    PlanningController.prototype.list = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var team, _a, page, pageSize, options, planning, e_3;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        team = req.user.team._id;
                        _a = req.query, page = _a.page, pageSize = _a.pageSize;
                        options = {
                            // select: {
                            //   vin: true,
                            //   brand: true,
                            //   denomination: true,
                            //   color: true
                            // },
                            populate: [{
                                    path: 'car',
                                    select: ['vin', 'brand', 'denomination', 'color']
                                }, {
                                    path: 'createdBy',
                                    select: ['vin', 'brand', 'denomination', 'color']
                                }],
                            sort: {
                                date: -1
                            },
                            page: parseInt(page ? page : "1", 10),
                            limit: parseInt(pageSize ? pageSize : "20", 10)
                        };
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.getPlanning({
                                team: team
                            }, options)];
                    case 2:
                        planning = _b.sent();
                        // validate exist page
                        if (options.page && planning.pages && planning.pages < options.page) {
                            res.status(400).json({
                                message: 'La página solicitada no existe.',
                                status: 200
                            });
                        }
                        else {
                            res.json({
                                count: planning.total,
                                pages: planning.pages,
                                hasPrevious: options.page && options.page > 1 && planning.pages && planning.pages >= options.page,
                                hasNext: options.page && planning.pages && planning.pages > options.page,
                                results: planning.docs,
                                status: 200
                            });
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        e_3 = _b.sent();
                        /* istanbul ignore next */
                        if (e_3) {
                            console.log(e_3);
                            res.status(500).json(e_3);
                        }
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    PlanningController.prototype.getPlanning = function (filters, options) {
        return new Promise(function (resolve, reject) {
            !planning_model_1["default"].paginate(filters, options, function (err, result) {
                if (err) {
                    /* istanbul ignore next */
                    reject(err);
                }
                resolve(result);
            });
        });
    };
    return PlanningController;
}());
exports["default"] = new PlanningController();
//# sourceMappingURL=planning.controller.js.map