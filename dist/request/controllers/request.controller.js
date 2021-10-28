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
var excel = require("exceljs");
var fs = require("fs");
var https = require("https");
var GraphicsMagick = require("gm");
var moment = require("moment");
var bson_1 = require("bson");
var car_model_1 = require("../../app/models/car.model");
var team_model_1 = require("../../app/models/team.model");
var participant_model_1 = require("../../form/models/participant.model");
var inventoryCar_model_1 = require("../../inventory/models/inventoryCar.model");
var server_1 = require("../../server");
var logger_service_1 = require("../../services/logger.service");
var general_utils_1 = require("../../utils/general.utils");
var request_model_1 = require("../models/request.model");
var requestFile_model_1 = require("../models/requestFile.model");
var requestItem_model_1 = require("../models/requestItem.model");
var requestItemStatus_model_1 = require("../models/requestItemStatus.model");
var activityHistory_model_1 = require("../../billing/models/activityHistory.model");
var reason_model_1 = require("../models/reason.model");
var RequestController = /** @class */ (function () {
    function RequestController() {
        this.itemPopulate = [{
                path: 'car'
            }, {
                path: 'request'
            }, {
                path: 'files'
            }, {
                path: 'reason',
                select: ['name']
            }, {
                path: 'status',
                select: ['name', 'weigth']
            }, {
                path: 'carrier',
                select: ['name']
            }, {
                path: 'origin',
                select: ['name']
            }, {
                path: 'destination',
                select: ['name']
            }];
        this.requestPopulate = [{
                path: 'origin',
                select: ['name']
            }, {
                path: 'destination',
                select: ['name']
            }, {
                path: 'channel',
                select: ['name']
            }, {
                path: 'createdBy',
                select: ['firstName', 'lastName']
            }, {
                path: 'items',
                options: {
                    sort: {
                        _id: 1
                    }
                },
                populate: this.itemPopulate
            }];
        this.aggregateCustomLabels = {
            totalDocs: 'total',
            docs: 'docs',
            limit: 'perPage',
            page: 'currentPage',
            nextPage: 'next',
            prevPage: 'prev',
            totalPages: 'pages',
            hasPrevPage: 'hasPrevious',
            hasNextPage: 'hasNext',
            pagingCounter: 'pageCounter'
        };
        this.index = this.index.bind(this);
        this.apiList = this.apiList.bind(this);
        this.apiListItems = this.apiListItems.bind(this);
        this.apiDetail = this.apiDetail.bind(this);
        this.apiCreate = this.apiCreate.bind(this);
        this.getRequets = this.getRequets.bind(this);
        this.apiPatchItem = this.apiPatchItem.bind(this);
        this.apiDeleteRequest = this.apiDeleteRequest.bind(this);
        this.apiDeleteRequestItem = this.apiDeleteRequestItem.bind(this);
        this.apiCreateItem = this.apiCreateItem.bind(this);
        this.exportExcel = this.exportExcel.bind(this);
        this.uploadFile = this.uploadFile.bind(this);
        this.autoRotate = this.autoRotate.bind(this);
        this.resizeImage = this.resizeImage.bind(this);
        this.downloadItemFiles = this.downloadItemFiles.bind(this);
        this.downloadFile = this.downloadFile.bind(this);
        this.apiUpdateMassive = this.apiUpdateMassive.bind(this);
        this.apiImport = this.apiImport.bind(this);
        this.createRequest = this.createRequest.bind(this);
    }
    RequestController.prototype.index = function (req, res) {
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
    RequestController.prototype.apiUpdateMassive = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var properties, team, _i, properties_1, property, find, update, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        properties = req.body.properties;
                        team = req.user.team;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 6, , 7]);
                        _i = 0, properties_1 = properties;
                        _a.label = 2;
                    case 2:
                        if (!(_i < properties_1.length)) return [3 /*break*/, 5];
                        property = properties_1[_i];
                        if (!(property.key.length && property.brands.length)) return [3 /*break*/, 4];
                        find = {
                            team: team,
                            $or: property.brands.map(function (brand) {
                                return {
                                    brand: {
                                        $regex: new RegExp(brand, 'i')
                                    }
                                };
                            })
                        };
                        update = { $set: { property: property.key } };
                        return [4 /*yield*/, car_model_1["default"].updateMany(find, update)];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5:
                        res.status(200).json({
                            message: 'Actualización realizada satisfactoriamente',
                            status: 200
                        });
                        return [3 /*break*/, 7];
                    case 6:
                        e_1 = _a.sent();
                        /* istanbul ignore next */
                        if (e_1) {
                            console.log(e_1);
                            res.status(500).json(e_1);
                        }
                        return [3 /*break*/, 7];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    RequestController.prototype.createRequest = function (user, request) {
        var _this = this;
        return new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
            var company, team, cars, number, channel, sellerText, operationType, defaultItemStatus, newRequest, _i, cars_1, car, currentCar, updatedRequest, e_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 12, , 13]);
                        company = user.company, team = user.team;
                        cars = request.cars, number = request.number, channel = request.channel, sellerText = request.sellerText, operationType = request.operationType;
                        return [4 /*yield*/, requestItemStatus_model_1["default"].findOneOrCreate({
                                team: team,
                                "default": true
                            }, {
                                name: 'Pendiente',
                                "default": true,
                                team: team,
                                weigth: 10
                            })];
                    case 1:
                        defaultItemStatus = _a.sent();
                        return [4 /*yield*/, new request_model_1["default"]({
                                team: team,
                                sellerText: sellerText,
                                number: number,
                                // mark origin and destination with first car
                                // TODO: change to venues arrays in cars
                                origin: cars[0].origin,
                                destination: cars[0].destination,
                                operationType: (operationType === null || operationType === void 0 ? void 0 : operationType.length) ? operationType : null,
                                channel: channel,
                                createdBy: user
                            }).save()];
                    case 2:
                        newRequest = _a.sent();
                        _i = 0, cars_1 = cars;
                        _a.label = 3;
                    case 3:
                        if (!(_i < cars_1.length)) return [3 /*break*/, 10];
                        car = cars_1[_i];
                        return [4 /*yield*/, car_model_1["default"].findOne({
                                team: team,
                                vin: car.vin.trim()
                            })];
                    case 4:
                        currentCar = _a.sent();
                        if (!currentCar) return [3 /*break*/, 5];
                        currentCar.engineNumber = car.engineNumber;
                        currentCar.brand = car.brand;
                        currentCar.color = car.color;
                        currentCar.denomination = car.denomination;
                        currentCar.type = car.type;
                        currentCar.client = car.client;
                        currentCar.entry = car.entry;
                        currentCar.invoice = car.invoice;
                        currentCar.bl = car.bl;
                        currentCar.engineSize = car.engineSize;
                        currentCar.driveType = car.driveType;
                        currentCar.businessYear = car.businessYear;
                        currentCar.manufacturingYear = car.manufacturingYear;
                        currentCar.price = car.price;
                        currentCar.insurancePrice = car.insurancePrice;
                        currentCar.weight = car.weight;
                        currentCar.gas = car.gas;
                        currentCar.ap = car.ap;
                        currentCar.countryOrigin = car.countryOrigin;
                        currentCar.save();
                        return [3 /*break*/, 7];
                    case 5: return [4 /*yield*/, new car_model_1["default"]({
                            team: team,
                            company: company,
                            vin: car.vin.trim(),
                            engineNumber: car.engineNumber,
                            brand: car.brand,
                            color: car.color,
                            denomination: car.denomination,
                            type: car.type,
                            client: car.client,
                            entry: car.entry,
                            invoice: car.invoice,
                            bl: car.bl,
                            engineSize: car.engineSize,
                            driveType: car.driveType,
                            businessYear: car.businessYear,
                            manufacturingYear: car.manufacturingYear,
                            price: car.price,
                            insurancePrice: car.insurancePrice,
                            weight: car.weight,
                            gas: car.gas,
                            ap: car.ap,
                            countryOrigin: car.countryOrigin,
                            status: car_model_1.ChoicesStatusCar.pending,
                            createdBy: user
                        }).save()];
                    case 6:
                        currentCar = _a.sent();
                        _a.label = 7;
                    case 7: return [4 /*yield*/, new requestItem_model_1["default"]({
                            team: team,
                            request: newRequest,
                            car: currentCar,
                            reason: car.reason,
                            origin: car.origin,
                            destination: car.destination,
                            observation: car.observation,
                            status: defaultItemStatus,
                            createdBy: user
                        }).save()];
                    case 8:
                        _a.sent();
                        _a.label = 9;
                    case 9:
                        _i++;
                        return [3 /*break*/, 3];
                    case 10: return [4 /*yield*/, request_model_1["default"].findById(newRequest._id).populate(this.requestPopulate)];
                    case 11:
                        updatedRequest = _a.sent();
                        server_1.io.to("request-list-" + team._id).emit('CREATE_REQUEST', {
                            request: updatedRequest
                        });
                        server_1.io.to("request-detail-" + team._id).emit('CREATE_REQUEST', {
                            request: updatedRequest
                        });
                        resolve({
                            updatedRequest: updatedRequest
                        });
                        return [3 /*break*/, 13];
                    case 12:
                        e_2 = _a.sent();
                        /* istanbul ignore next */
                        logger_service_1["default"].error("RequestController.createRequest: Async Error.");
                        /* istanbul ignore next */
                        logger_service_1["default"].error("{user: {_id: " + user._id + ", email: " + user.email + "}, user: " + JSON.stringify(user));
                        logger_service_1["default"].error(e_2);
                        reject(e_2);
                        return [3 /*break*/, 13];
                    case 13: return [2 /*return*/];
                }
            });
        }); });
    };
    RequestController.prototype.apiImport = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var team, requests, requestsNumbers, existsRequest, updateTeam, maxRequest, minRequest, e_3;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 9, , 10]);
                        team = req.user.team;
                        requests = req.body.requests;
                        if (!(requests === null || requests === void 0 ? void 0 : requests.length)) return [3 /*break*/, 7];
                        requestsNumbers = requests.map(function (request) { return parseInt(request.number); });
                        return [4 /*yield*/, request_model_1["default"].find({ team: team, number: { $in: requestsNumbers } })];
                    case 1:
                        existsRequest = _a.sent();
                        return [4 /*yield*/, team_model_1["default"].findOne({ _id: team._id })];
                    case 2:
                        updateTeam = _a.sent();
                        maxRequest = Math.max.apply(Math, requestsNumbers);
                        minRequest = Math.min.apply(Math, requestsNumbers);
                        if (!existsRequest.length) return [3 /*break*/, 3];
                        res.status(400).json({
                            message: "Solicitudes n\u00FAmero " + existsRequest.map(function (e) { return e.number; }).join(',') + " ya " + (existsRequest.length > 1 ? 'existen' : 'existe'),
                            status: 400
                        });
                        return [3 /*break*/, 6];
                    case 3:
                        if (!(minRequest < updateTeam.requestNumber)) return [3 /*break*/, 4];
                        res.status(400).json({
                            message: "El n\u00FAmero de solicitud no puede ser menor que " + updateTeam.requestNumber,
                            status: 400
                        });
                        return [3 /*break*/, 6];
                    case 4:
                        requests.forEach(function (request) { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, this.createRequest(req.user, request)];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); });
                        return [4 /*yield*/, team_model_1["default"].findOneAndUpdate({ _id: team._id }, { $set: { requestNumber: maxRequest } })];
                    case 5:
                        _a.sent();
                        res.status(200).json({
                            message: 'Actualización realizada satisfactoriamente',
                            status: 200
                        });
                        _a.label = 6;
                    case 6: return [3 /*break*/, 8];
                    case 7:
                        res.status(400).json({
                            message: 'Datos invalidos',
                            status: 400
                        });
                        _a.label = 8;
                    case 8: return [3 /*break*/, 10];
                    case 9:
                        e_3 = _a.sent();
                        /* istanbul ignore next */
                        if (e_3) {
                            console.log(e_3);
                            res.status(500).json(e_3);
                        }
                        return [3 /*break*/, 10];
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    RequestController.prototype.apiCreate = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, company, team, _b, cars, venue, channel, sellerText, operationType, defaultItemStatus, updateTeam, request, _i, cars_2, car, newCar, newRequest, e_4;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        logger_service_1["default"].info("RequestController.apiCreate");
                        logger_service_1["default"].info("{user: {_id: " + req.user._id + ", email: " + req.user.email + "}, body: " + JSON.stringify(req.body) + " }");
                        _a = req.user, company = _a.company, team = _a.team;
                        _b = req.body, cars = _b.cars, venue = _b.venue, channel = _b.channel, sellerText = _b.sellerText, operationType = _b.operationType;
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 11, , 12]);
                        return [4 /*yield*/, requestItemStatus_model_1["default"].findOneOrCreate({
                                team: team,
                                "default": true
                            }, {
                                name: 'Pendiente',
                                "default": true,
                                team: team,
                                weigth: 10
                            })];
                    case 2:
                        defaultItemStatus = _c.sent();
                        return [4 /*yield*/, team_model_1["default"].findOneAndUpdate({ _id: team._id }, { $inc: { requestNumber: 1 } }, { "new": true })];
                    case 3:
                        updateTeam = _c.sent();
                        return [4 /*yield*/, new request_model_1["default"]({
                                team: team,
                                sellerText: sellerText,
                                number: updateTeam.requestNumber,
                                origin: venue,
                                destination: venue,
                                operationType: (operationType === null || operationType === void 0 ? void 0 : operationType.length) ? operationType : null,
                                // status,
                                channel: channel,
                                createdBy: req.user
                            }).save()];
                    case 4:
                        request = _c.sent();
                        _i = 0, cars_2 = cars;
                        _c.label = 5;
                    case 5:
                        if (!(_i < cars_2.length)) return [3 /*break*/, 9];
                        car = cars_2[_i];
                        return [4 /*yield*/, new car_model_1["default"]({
                                team: team,
                                company: company,
                                brand: car.brand,
                                denomination: car.denomination,
                                material: car.material,
                                color: car.color,
                                status: car_model_1.ChoicesStatusCar.pending,
                                createdBy: req.user
                            }).save()];
                    case 6:
                        newCar = _c.sent();
                        return [4 /*yield*/, new requestItem_model_1["default"]({
                                team: team,
                                request: request,
                                car: newCar,
                                reason: car.reason,
                                files: car.files,
                                washed: car.washed,
                                answers: car.answers,
                                equipment: car.equipment,
                                observation: car.observation,
                                priority: car.priority,
                                origin: req.user.venue,
                                destination: venue,
                                status: defaultItemStatus,
                                createdBy: req.user
                            }).save()];
                    case 7:
                        _c.sent();
                        _c.label = 8;
                    case 8:
                        _i++;
                        return [3 /*break*/, 5];
                    case 9: return [4 /*yield*/, request_model_1["default"].findById(request._id).populate(this.requestPopulate)];
                    case 10:
                        newRequest = _c.sent();
                        server_1.io.to("request-list-" + team._id).emit('CREATE_REQUEST', {
                            request: newRequest
                        });
                        server_1.io.to("request-detail-" + team._id).emit('CREATE_REQUEST', {
                            request: newRequest
                        });
                        res.json({
                            status: 200
                        });
                        return [3 /*break*/, 12];
                    case 11:
                        e_4 = _c.sent();
                        /* istanbul ignore next */
                        logger_service_1["default"].error("RequestController.apiCreate: Async Error.");
                        /* istanbul ignore next */
                        logger_service_1["default"].error("{user: {_id: " + req.user._id + ", email: " + req.user.email + "}, body: " + JSON.stringify(req.body));
                        logger_service_1["default"].error(e_4);
                        res.status(500).json(e_4);
                        return [3 /*break*/, 12];
                    case 12: return [2 /*return*/];
                }
            });
        });
    };
    RequestController.prototype.apiListItems = function (req, res) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var team, _b, page, pageSize, orderBy, orderType, filters, venuesIds, extraQuery, extraMatch, requestNumbers, baseAggregate, aggregatePopulate, aggregate, requestsAggregate, options, requests, options, query, request, e_5;
            var _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        logger_service_1["default"].info("RequestController.apiListItems");
                        logger_service_1["default"].info("{user: {_id: " + req.user._id + ", email: " + req.user.email + "}, body: " + JSON.stringify(req.body) + " }");
                        team = req.user.team._id;
                        _b = req.body, page = _b.page, pageSize = _b.pageSize, orderBy = _b.orderBy, orderType = _b.orderType, filters = _b.filters;
                        extraQuery = {};
                        extraMatch = {};
                        if (filters.venues && filters.venues.length) {
                            venuesIds = req.user.venuesPermissions().filter(function (venue) { return (filters.venues.includes(venue.toString())); });
                        }
                        else {
                            venuesIds = req.user.venuesPermissions();
                        }
                        if (filters.status && filters.status.length) {
                            extraQuery.status = { $in: filters.status.map(function (status) { return new bson_1.ObjectID(status); }) };
                        }
                        if (filters.from) {
                            if (!extraQuery.hasOwnProperty('createdAt')) {
                                extraQuery.createdAt = {};
                            }
                            extraQuery.createdAt.$gte = moment(filters.from).startOf('day').toDate();
                        }
                        if (filters.to) {
                            if (!extraQuery.hasOwnProperty('createdAt')) {
                                extraQuery.createdAt = {};
                            }
                            extraQuery.createdAt.$lte = moment(filters.to).endOf('day').toDate();
                        }
                        requestNumbers = filters.request
                            .replace(/[^0-9,]/g, '')
                            .split(',')
                            .filter(function (requestNumber) { return (requestNumber.length); });
                        if (requestNumbers.length) {
                            extraMatch.requestNumber = { $in: requestNumbers };
                        }
                        if ((_a = filters.entry) === null || _a === void 0 ? void 0 : _a.length) {
                            extraMatch['car.entry'] = { '$regex': filters.entry, '$options': 'i' };
                        }
                        else if (filters.text) {
                            extraMatch.$or = [];
                            extraMatch.$or.push({
                                'car.vin': { '$regex': filters.text, '$options': 'i' }
                            });
                            extraMatch.$or.push({
                                'car.brand': { '$regex': filters.text, '$options': 'i' }
                            });
                            extraMatch.$or.push({
                                'car.color': { '$regex': filters.text, '$options': 'i' }
                            });
                            extraMatch.$or.push({
                                'car.denomination': { '$regex': filters.text, '$options': 'i' }
                            });
                            extraMatch.$or.push({
                                'car.material': { '$regex': filters.text, '$options': 'i' }
                            });
                            extraMatch.$or.push({
                                'requestNumber': { '$regex': filters.text, '$options': 'i' }
                            });
                        }
                        if (filters.properties && filters.properties.length) {
                            if (!extraMatch.hasOwnProperty('$or')) {
                                extraMatch.$or = [];
                            }
                            extraMatch.$or.push({
                                'car.property': { $in: filters.properties.map(function (s) { return s; }) }
                            });
                        }
                        _d.label = 1;
                    case 1:
                        _d.trys.push([1, 6, , 7]);
                        if (!(orderBy !== 'request.number' || Object.keys(extraMatch).length || Object.keys(extraQuery).length)) return [3 /*break*/, 3];
                        if (filters && filters.transmitttalModule) {
                            extraQuery.assigned = { $in: [null, false] };
                        }
                        baseAggregate = [{
                                $match: __assign({ team: team, $or: [{
                                            destination: {
                                                $in: venuesIds
                                            }
                                        }, {
                                            origin: {
                                                $in: venuesIds
                                            }
                                        }] }, extraQuery)
                            }];
                        aggregatePopulate = [{
                                $lookup: { from: 'cars', localField: 'car', foreignField: '_id', as: 'car' }
                            }, {
                                $unwind: { path: '$car', preserveNullAndEmptyArrays: true }
                            }, {
                                $lookup: { from: 'venues', localField: 'origin', foreignField: '_id', as: 'origin' }
                            }, {
                                $unwind: { path: '$origin', preserveNullAndEmptyArrays: true }
                            }, {
                                $lookup: { from: 'venues', localField: 'destination', foreignField: '_id', as: 'destination' }
                            }, {
                                $unwind: { path: '$destination', preserveNullAndEmptyArrays: true }
                            }, {
                                $lookup: { from: 'requests', localField: 'request', foreignField: '_id', as: 'request' }
                            }, {
                                $unwind: { path: '$request', preserveNullAndEmptyArrays: false }
                            }, {
                                $lookup: { from: 'users', localField: 'request.createdBy', foreignField: '_id', as: 'request.createdBy' }
                            }, {
                                $unwind: { path: '$request.createdBy', preserveNullAndEmptyArrays: false }
                            }, {
                                $lookup: { from: 'requestitemstatuses', localField: 'status', foreignField: '_id', as: 'status' }
                            }, {
                                $unwind: { path: '$status', preserveNullAndEmptyArrays: true }
                            }, {
                                $lookup: { from: 'requestfiles', localField: 'files', foreignField: '_id', as: 'files' }
                            }, {
                                $lookup: { from: 'reasons', localField: 'reason', foreignField: '_id', as: 'reason' }
                            }, {
                                $unwind: { path: '$reason', preserveNullAndEmptyArrays: true }
                            }, {
                                $addFields: { requestNumber: { $toString: '$request.number' } }
                            }, {
                                $project: {
                                    '_id': 1,
                                    'request._id': 1,
                                    'request.number': 1,
                                    'request.createdBy.firstName': 1,
                                    'request.createdBy.lastName': 1,
                                    'priority': 1,
                                    'observation': 1,
                                    'equipment': 1,
                                    'washed': 1,
                                    'review': 1,
                                    'body': 1,
                                    'files._id': 1,
                                    'requestNumber': 1,
                                    'status._id': 1,
                                    'status.name': 1,
                                    'status.weigth': 1,
                                    'car._id': 1,
                                    'car.vin': 1,
                                    'car.brand': 1,
                                    'car.color': 1,
                                    'car.material': 1,
                                    'car.entry': 1,
                                    'car.invoice': 1,
                                    'car.patent': 1,
                                    'car.property': 1,
                                    'car.type': 1,
                                    'car.client': 1,
                                    'car.bl': 1,
                                    'car.denomination': 1,
                                    'car.internalNumber': 1,
                                    'origin._id': 1,
                                    'origin.name': 1,
                                    'destination._id': 1,
                                    'destination.name': 1,
                                    'reason._id': 1,
                                    'reason.name': 1,
                                    'uploadDate': 1,
                                    'estimatedArrival': 1,
                                    'createdAt': 1,
                                    'updatedAt': 1
                                }
                            }, {
                                $match: __assign({ $or: [{
                                            'destination._id': {
                                                $in: venuesIds
                                            }
                                        }, {
                                            'origin._id': {
                                                $in: venuesIds
                                            }
                                        }] }, extraMatch)
                            }];
                        aggregate = __spreadArray(__spreadArray(__spreadArray([], baseAggregate, true), aggregatePopulate, true), [
                            {
                                $sort: (_c = {}, _c[orderBy] = orderType === 'ascending' ? 1 : -1, _c)
                            }
                        ], false);
                        requestsAggregate = requestItem_model_1["default"].aggregate(aggregate);
                        options = {
                            page: parseInt(page ? page : '1', 10),
                            limit: parseInt(pageSize ? pageSize : '10', 10),
                            customLabels: this.aggregateCustomLabels
                        };
                        return [4 /*yield*/, requestItem_model_1["default"].aggregatePaginate(requestsAggregate, options)];
                    case 2:
                        requests = _d.sent();
                        if (options.page && requests.pages && requests.pages < options.page) {
                            res.status(400).json({
                                message: 'La página solicitada no existe.',
                                status: 400
                            });
                        }
                        else {
                            res.json({
                                count: requests.total,
                                pages: requests.pages,
                                hasPrevious: requests.hasPrevious,
                                hasNext: requests.hasNext,
                                results: requests.docs,
                                status: 200
                            });
                        }
                        return [3 /*break*/, 5];
                    case 3:
                        options = {
                            sort: {
                                _id: -1
                            },
                            select: ['priority', 'observation', 'createdAt', 'updatedAt'],
                            populate: [{
                                    path: 'files',
                                    select: ['_id']
                                }, {
                                    path: 'request',
                                    select: ['number', 'createdAt'],
                                    populate: [{
                                            path: 'createdBy',
                                            select: ['firstName', 'lastName']
                                        }]
                                }, {
                                    path: 'car',
                                    select: ['vin', 'internalNumber', 'patent', 'color', 'brand', 'denomination', 'material', 'property', 'type', 'client', 'bl', 'invoice', 'entry']
                                }, {
                                    path: 'reason',
                                    select: ['name']
                                }, {
                                    path: 'origin',
                                    select: ['name']
                                }, {
                                    path: 'destination',
                                    select: ['name']
                                }, {
                                    path: 'status',
                                    select: ['name', 'weigth']
                                }],
                            page: parseInt(page ? page : '1', 10),
                            limit: parseInt(pageSize ? pageSize : '200', 10)
                        };
                        query = {
                            team: team,
                            $or: [{
                                    destination: {
                                        $in: venuesIds
                                    }
                                }, {
                                    origin: {
                                        $in: venuesIds
                                    }
                                }]
                        };
                        if (filters && filters.transmitttalModule) {
                            query.assigned = { $in: [null, false] };
                        }
                        return [4 /*yield*/, requestItem_model_1["default"].paginate(query, options)];
                    case 4:
                        request = _d.sent();
                        res.json({
                            extraMatch: extraMatch,
                            extraQuery: extraQuery,
                            count: request.total,
                            pages: request.pages,
                            hasPrevious: options.page && options.page > 1 && request.pages && request.pages >= options.page,
                            hasNext: options.page && request.pages && request.pages > options.page,
                            results: request.docs,
                            status: 200
                        });
                        _d.label = 5;
                    case 5: return [3 /*break*/, 7];
                    case 6:
                        e_5 = _d.sent();
                        /* istanbul ignore next */
                        logger_service_1["default"].error("RequestController.apiListItems: Async Error.");
                        /* istanbul ignore next */
                        logger_service_1["default"].error("{user: {_id: " + req.user._id + ", email: " + req.user.email + "}, body: " + JSON.stringify(req.body) + ", params: " + JSON.stringify(req.params));
                        logger_service_1["default"].error(e_5);
                        res.status(500).json(e_5);
                        return [3 /*break*/, 7];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    RequestController.prototype.exportExcel = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var team, cursor_1, options, workbook_1, worksheet_1, questionColumns, _i, _a, reason, _b, _c, question, e_6;
            var _this = this;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        team = req.user.team._id;
                        _d.label = 1;
                    case 1:
                        _d.trys.push([1, 6, , 7]);
                        cursor_1 = requestItem_model_1["default"].aggregate([{
                                $match: {
                                    team: team,
                                    'destination': {
                                        $in: req.user.venuesPermissions()
                                    }
                                }
                            }, {
                                $lookup: { from: 'cars', localField: 'car', foreignField: '_id', as: 'car' }
                            }, {
                                $unwind: { path: '$car', preserveNullAndEmptyArrays: true }
                            }, {
                                $lookup: { from: 'users', localField: 'createdBy', foreignField: '_id', as: 'createdBy' }
                            }, {
                                $unwind: { path: '$createdBy', preserveNullAndEmptyArrays: true }
                            }, {
                                $lookup: { from: 'venues', localField: 'origin', foreignField: '_id', as: 'origin' }
                            }, {
                                $unwind: { path: '$origin', preserveNullAndEmptyArrays: true }
                            }, {
                                $lookup: { from: 'venues', localField: 'destination', foreignField: '_id', as: 'destination' }
                            }, {
                                $unwind: { path: '$destination', preserveNullAndEmptyArrays: true }
                            }, {
                                $lookup: { from: 'requests', localField: 'request', foreignField: '_id', as: 'request' }
                            }, {
                                $unwind: { path: '$request', preserveNullAndEmptyArrays: false }
                            }, {
                                $lookup: { from: 'requestitemstatuses', localField: 'status', foreignField: '_id', as: 'status' }
                            }, {
                                $unwind: { path: '$status', preserveNullAndEmptyArrays: true }
                            }, {
                                $lookup: { from: 'carriers', localField: 'carrier', foreignField: '_id', as: 'carrier' }
                            }, {
                                $unwind: { path: '$carrier', preserveNullAndEmptyArrays: true }
                            }, {
                                $lookup: { from: 'reasons', localField: 'reason', foreignField: '_id', as: 'reason' }
                            }, {
                                $unwind: { path: '$reason', preserveNullAndEmptyArrays: true }
                            }, {
                                $lookup: { from: 'saleschannels', localField: 'request.channel', foreignField: '_id', as: 'request.channel' }
                            }, {
                                $unwind: { path: '$request.channel', preserveNullAndEmptyArrays: true }
                            }, {
                                $project: {
                                    '_id': 1,
                                    'request': 1,
                                    'priority': 1,
                                    'observation': 1,
                                    'equipment': 1,
                                    'washed': 1,
                                    'answers': 1,
                                    'review': 1,
                                    'body': 1,
                                    'status._id': 1,
                                    'status.name': 1,
                                    'carrier._id': 1,
                                    'carrier.name': 1,
                                    'status.weigth': 1,
                                    'createdBy._id': 1,
                                    'createdBy.firstName': 1,
                                    'createdBy.lastName': 1,
                                    'car': 1,
                                    'origin._id': 1,
                                    'origin.name': 1,
                                    'destination._id': 1,
                                    'destination.name': 1,
                                    'reason._id': 1,
                                    'reason.name': 1,
                                    'uploadDate': 1,
                                    'estimatedArrival': 1,
                                    'createdAt': 1,
                                    'updatedAt': 1
                                }
                            }, {
                                $sort: { _id: 1 }
                            }]).cursor({ batchSize: 100 }).exec();
                        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                        res.setHeader('Content-Disposition', 'attachment; filename=requests.xlsx');
                        options = {
                            stream: res,
                            useStyles: true,
                            useSharedStrings: true
                        };
                        workbook_1 = new excel.stream.xlsx.WorkbookWriter(options);
                        worksheet_1 = workbook_1.addWorksheet('Usuarios', {
                            properties: {
                                defaultRowHeight: 30
                            }, pageSetup: {
                                fitToPage: true, fitToHeight: 100, fitToWidth: 1
                            }
                        });
                        questionColumns = [];
                        _i = 0;
                        return [4 /*yield*/, reason_model_1["default"].find({ team: team })];
                    case 2:
                        _a = _d.sent();
                        _d.label = 3;
                    case 3:
                        if (!(_i < _a.length)) return [3 /*break*/, 5];
                        reason = _a[_i];
                        for (_b = 0, _c = reason.questions; _b < _c.length; _b++) {
                            question = _c[_b];
                            questionColumns.push({
                                header: question.name, key: question._id, width: 10
                            });
                        }
                        _d.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 3];
                    case 5:
                        worksheet_1.columns = __spreadArray([{
                                header: 'Nª SOLICITUD', key: 'request', width: 10
                            }, {
                                header: 'FECHA SOLICITUD', key: 'created', width: 21, style: { numFmt: 'dd/mm/yyyy hh:mm' }
                            }, {
                                header: 'CANAL', key: 'channel', width: 20
                            }, {
                                header: 'PRIORIDAD', key: 'priority', width: 20
                            }, {
                                header: 'SUCURSAL (CREACION)', key: 'origin', width: 20
                            }, {
                                header: 'SOLICITANTE', key: 'createdBy', width: 20
                            }, {
                                header: 'VENDEDOR', key: 'seller', width: 20
                            }, {
                                header: 'MOTIVO', key: 'reason', width: 20
                            }, {
                                header: 'GRUPO', key: 'group', width: 20
                            }, {
                                header: 'PROPIEDAD', key: 'property', width: 20
                            }, {
                                header: 'MARCA', key: 'brand', width: 20
                            }, {
                                header: 'MODELO', key: 'denomination', width: 20
                            }, {
                                header: 'MATERIAL', key: 'material', width: 20
                            }, {
                                header: 'COLOR', key: 'color', width: 20
                            }, {
                                header: 'ESTADO', key: 'status', width: 20
                            }, {
                                header: 'VIN/ID', key: 'vin', width: 20
                            }, {
                                header: 'CDO', key: 'cdo', width: 20
                            }, {
                                header: 'ACCESORIZACIÓN', key: 'equipment', width: 10
                            }, {
                                header: 'PRE-LAVADO', key: 'washed', width: 10
                            }, {
                                header: 'INSPECCIÓN Pre-entrega', key: 'review', width: 10
                            }, {
                                header: 'CARROCERO', key: 'body', width: 10
                            }, {
                                header: 'EQUIPAMIENTO', key: 'equipment_2', width: 10
                            }, {
                                header: 'DESTINO', key: 'destination', width: 20
                            }, {
                                header: 'TRANSPORTISTA', key: 'carrier', width: 20
                            }, {
                                header: 'FECHA CARGA', key: 'uploadDate', width: 21, style: { numFmt: 'dd/mm/yyyy hh:mm' }
                            }, {
                                header: 'FECHA LLEGADA', key: 'estimatedArrival', width: 21, style: { numFmt: 'dd/mm/yyyy hh:mm' }
                            }, {
                                header: 'FECHA ACTUALIZACION', key: 'updated', width: 21, style: { numFmt: 'dd/mm/yyyy hh:mm' }
                            }, {
                                header: 'OBSERVACIÓN', key: 'observation', width: 21
                            }], questionColumns, true);
                        // for (const item of requestItems) {
                        cursor_1.on('data', function (item) { return __awaiter(_this, void 0, void 0, function () {
                            var extraAnswers, _i, _a, answer;
                            return __generator(this, function (_b) {
                                extraAnswers = {};
                                for (_i = 0, _a = item.answers ? item.answers : []; _i < _a.length; _i++) {
                                    answer = _a[_i];
                                    extraAnswers[answer.questionId] = answer.answer;
                                }
                                worksheet_1.addRow(__assign(__assign({}, extraAnswers), { request: item.request.number, created: item.createdAt, updated: item.updatedAt, observation: item.observation, fleet: item.request.fleet ? 'Si' : 'No', priority: item.priority ? 'Si' : 'No', createdBy: item.createdBy ? item.createdBy.firstName + " " + item.createdBy.lastName : '-', seller: item.request.sellerText, channel: item.request.channel ? item.request.channel.name : '', reason: item.reason.name, group: '', property: item.car.property, brand: item.car.brand, denomination: item.car.denomination, material: item.car.material, vin: item.car.vin, cdo: item.car.internalNumber, color: item.car.color, destination: item.destination.name, origin: item.origin.name, status: item.status.name, equipment: item.equipment ? 'Si' : 'No', body: item.body ? 'Si' : 'No', washed: item.washed ? 'Si' : 'No', review: item.review ? 'Si' : 'No', carrier: item.carrier ? item.carrier.name : '', uploadDate: item.uploadDate, estimatedArrival: item.estimatedArrival }));
                                return [2 /*return*/];
                            });
                        }); });
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
                        return [3 /*break*/, 7];
                    case 6:
                        e_6 = _d.sent();
                        /* istanbul ignore next */
                        logger_service_1["default"].error(e_6);
                        /* istanbul ignore next */
                        logger_service_1["default"].error("RequestController.exportExcel: Async Error.");
                        /* istanbul ignore next */
                        logger_service_1["default"].error("{user: {_id: " + req.user._id + ", email: " + req.user.email + "}, body: " + JSON.stringify(req.body) + ", params: " + JSON.stringify(req.params));
                        logger_service_1["default"].error(e_6);
                        res.status(500).json(e_6);
                        return [3 /*break*/, 7];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    RequestController.prototype.apiList = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var team, _a, page, pageSize, search, orderBy, orderType, options, filter, requests, e_7;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        logger_service_1["default"].info("RequestController.apiList");
                        logger_service_1["default"].info("{user: {_id: " + req.user._id + ", email: " + req.user.email + "}}");
                        team = req.user.team._id;
                        _a = req.query, page = _a.page, pageSize = _a.pageSize, search = _a.search, orderBy = _a.orderBy, orderType = _a.orderType;
                        options = {
                            sort: (_b = {},
                                _b[orderBy] = orderType === 'ascending' ? 1 : -1,
                                _b),
                            populate: this.requestPopulate,
                            // select: {_id: true},
                            page: parseInt(page ? page : '1', 10),
                            limit: parseInt(pageSize ? pageSize : '20', 10)
                        };
                        filter = {
                            team: team,
                            destination: {
                                $in: req.user.venuesPermissions()
                            }
                        };
                        if (search) {
                            // add here conditions tu search
                        }
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.getRequets(filter, options)];
                    case 2:
                        requests = _c.sent();
                        /* istanbul ignore if  */
                        if (options.page && requests.pages && requests.pages < options.page) {
                            res.status(400).json({
                                message: 'La página solicitada no existe.',
                                status: 400
                            });
                        }
                        else {
                            res.json({
                                count: requests.total,
                                pages: requests.pages,
                                hasPrevious: options.page && options.page > 1 && requests.pages && requests.pages >= options.page,
                                hasNext: options.page && requests.pages && requests.pages > options.page,
                                results: requests.docs,
                                status: 200
                            });
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        e_7 = _c.sent();
                        /* istanbul ignore next */
                        logger_service_1["default"].error("RequestController.apiList: Async Error.");
                        /* istanbul ignore next */
                        logger_service_1["default"].error("{user: {_id: " + req.user._id + ", email: " + req.user.email + "}}");
                        res.status(500).json(e_7);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    RequestController.prototype.apiDetail = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var team, id, request, e_8;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        logger_service_1["default"].info("RequestController.apiDetail");
                        logger_service_1["default"].info("{user: {_id: " + req.user._id + ", email: " + req.user.email + "}}");
                        team = req.user.team._id;
                        id = req.params.id;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, request_model_1["default"]
                                .findOne({
                                _id: id,
                                team: team
                            })
                                .populate(this.requestPopulate)];
                    case 2:
                        request = _a.sent();
                        if (request) {
                            res.json(request);
                        }
                        else {
                            res.status(404).json({
                                message: "No se ha encontrado la solicitud " + id,
                                status: 404
                            });
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        e_8 = _a.sent();
                        /* istanbul ignore next */
                        logger_service_1["default"].error("RequestController.apiDetail: Async Error.");
                        /* istanbul ignore next */
                        logger_service_1["default"].error("{user: {_id: " + req.user._id + ", email: " + req.user.email + "}, body: " + JSON.stringify(req.body) + ", params: " + JSON.stringify(req.params));
                        logger_service_1["default"].error(e_8);
                        res.status(500).json(e_8);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    RequestController.prototype.apiDeleteRequest = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var team, id, request, e_9;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        logger_service_1["default"].info("RequestController.apiDeleteRequest");
                        team = req.user.team._id;
                        id = req.params.id;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 7, , 8]);
                        return [4 /*yield*/, request_model_1["default"]
                                .findOne({
                                _id: id,
                                team: team
                            })];
                    case 2:
                        request = _a.sent();
                        if (!request) return [3 /*break*/, 5];
                        return [4 /*yield*/, requestItem_model_1["default"].find({ _id: id, team: team }).remove()];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, request.remove()];
                    case 4:
                        _a.sent();
                        server_1.io.to("request-list-" + team).emit('DELETE_REQUEST', {
                            idRequest: request._id
                        });
                        server_1.io.to("request-detail-" + team).emit('DELETE_REQUEST', {
                            idRequest: request._id
                        });
                        res.status(200).json({
                            message: "ok",
                            status: 200
                        });
                        return [3 /*break*/, 6];
                    case 5:
                        res.status(404).json({
                            message: "No se ha encontrado la solicitud " + id,
                            status: 404
                        });
                        _a.label = 6;
                    case 6: return [3 /*break*/, 8];
                    case 7:
                        e_9 = _a.sent();
                        /* istanbul ignore next */
                        logger_service_1["default"].error("RequestController.apiDeleteRequest: Async Error.");
                        /* istanbul ignore next */
                        logger_service_1["default"].error("{user: {_id: " + req.user._id + ", email: " + req.user.email + "}, body: " + JSON.stringify(req.body) + ", params: " + JSON.stringify(req.params));
                        logger_service_1["default"].error(e_9);
                        res.status(500).json(e_9);
                        return [3 /*break*/, 8];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    RequestController.prototype.apiDeleteRequestItem = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var team, id, item, e_10;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        logger_service_1["default"].info("RequestController.apiDeleteRequestItem");
                        team = req.user.team._id;
                        id = req.params.id;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 7, , 8]);
                        return [4 /*yield*/, requestItem_model_1["default"]
                                .findOne({
                                _id: id,
                                team: team
                            })
                                .populate(this.itemPopulate)];
                    case 2:
                        item = _a.sent();
                        if (!item) return [3 /*break*/, 5];
                        return [4 /*yield*/, item.remove()];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, request_model_1["default"].update({ _id: item.request._id }, { $set: { updatedAt: moment() } })];
                    case 4:
                        _a.sent();
                        server_1.io.to("request-list-" + team).emit('DELETE_REQUEST_ITEM', {
                            idRequest: item.request._id,
                            item: item
                        });
                        server_1.io.to("request-detail-" + team).emit('DELETE_REQUEST_ITEM', {
                            idRequest: item.request._id,
                            item: item
                        });
                        res.status(200).json({
                            message: "ok",
                            status: 200
                        });
                        return [3 /*break*/, 6];
                    case 5:
                        res.status(404).json({
                            message: "No se ha encontrado la solicitud " + id,
                            status: 404
                        });
                        _a.label = 6;
                    case 6: return [3 /*break*/, 8];
                    case 7:
                        e_10 = _a.sent();
                        /* istanbul ignore next */
                        logger_service_1["default"].error("RequestController.apiDeleteRequestItem: Async Error.");
                        /* istanbul ignore next */
                        logger_service_1["default"].error("{user: {_id: " + req.user._id + ", email: " + req.user.email + "}, body: " + JSON.stringify(req.body) + ", params: " + JSON.stringify(req.params));
                        logger_service_1["default"].error(e_10);
                        res.status(500).json(e_10);
                        return [3 /*break*/, 8];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    RequestController.prototype.searhCar = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var team, search, cars, e_11;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        logger_service_1["default"].info("RequestController.searhCar");
                        team = req.user.team._id;
                        search = req.query.search;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, car_model_1["default"].aggregate([{
                                    $match: {
                                        team: team,
                                        $text: {
                                            $search: search,
                                            $diacriticSensitive: false
                                        }
                                    }
                                }, {
                                    $project: {
                                        vin: 1,
                                        brand: 1,
                                        denomination: 1,
                                        material: 1,
                                        score: {
                                            $meta: 'textScore'
                                        }
                                    }
                                }, {
                                    $match: {
                                        score: {
                                            $gt: 0.5
                                        }
                                    }
                                }, {
                                    $group: {
                                        _id: {
                                            brand: '$brand',
                                            denomination: '$denomination',
                                            material: '$material',
                                            score: '$score'
                                        }
                                    }
                                }, {
                                    $sort: {
                                        '_id.score': -1
                                    }
                                }, {
                                    $limit: 100
                                }, {
                                    $project: {
                                        brand: '$_id.brand',
                                        denomination: '$_id.denomination',
                                        material: '$_id.material',
                                        score: '$_id.score',
                                        _id: false
                                    }
                                }])];
                    case 2:
                        cars = _a.sent();
                        res.json({
                            cars: cars
                        });
                        return [3 /*break*/, 4];
                    case 3:
                        e_11 = _a.sent();
                        /* istanbul ignore next */
                        logger_service_1["default"].error("RequestController.searhCar: Async Error.");
                        /* istanbul ignore next */
                        logger_service_1["default"].error("{user: {_id: " + req.user._id + ", email: " + req.user.email + "}}");
                        logger_service_1["default"].error(e_11);
                        res.status(500).json(e_11);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    RequestController.prototype.apiCreateItem = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var company, team, _a, car, idRequest, request, defaultItemStatus, newCar, newItem, item, e_12;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        logger_service_1["default"].info("RequestController.apiCreateItem");
                        logger_service_1["default"].info("{user: {_id: " + req.user._id + ", email: " + req.user.email + "}, body: " + JSON.stringify(req.body) + " }");
                        company = req.user.company;
                        team = req.user.team._id;
                        _a = req.body, car = _a.car, idRequest = _a.idRequest;
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 9, , 10]);
                        return [4 /*yield*/, request_model_1["default"].findOne({ _id: idRequest, team: team })];
                    case 2:
                        request = _b.sent();
                        if (!request) return [3 /*break*/, 7];
                        return [4 /*yield*/, requestItemStatus_model_1["default"].findOneOrCreate({ team: team, "default": true }, { name: 'En proceso', "default": true, team: team })];
                    case 3:
                        defaultItemStatus = _b.sent();
                        return [4 /*yield*/, new car_model_1["default"]({
                                team: team,
                                company: company,
                                brand: car.brand,
                                denomination: car.denomination,
                                material: car.material,
                                color: car.color,
                                status: car_model_1.ChoicesStatusCar.pending,
                                createdBy: req.user
                            }).save()];
                    case 4:
                        newCar = _b.sent();
                        return [4 /*yield*/, new requestItem_model_1["default"]({
                                team: team,
                                request: request,
                                car: newCar,
                                reason: car.reason,
                                washed: car.washed,
                                equipment: car.equipment,
                                priority: car.priority,
                                origin: request.origin,
                                destination: request.destination,
                                status: defaultItemStatus,
                                createdBy: req.user
                            }).save()];
                    case 5:
                        newItem = _b.sent();
                        return [4 /*yield*/, requestItem_model_1["default"].findOne({ _id: newItem._id }).populate(this.itemPopulate)];
                    case 6:
                        item = _b.sent();
                        request.update({ $set: { updatedAt: moment() } });
                        server_1.io.to("request-list-" + team).emit('CREATE_REQUEST_ITEM', {
                            idRequest: request._id,
                            item: item
                        });
                        server_1.io.to("request-detail-" + team).emit('CREATE_REQUEST_ITEM', {
                            idRequest: request._id,
                            item: item
                        });
                        res.status(200).json(__assign({}, item));
                        return [3 /*break*/, 8];
                    case 7:
                        res.status(404).json({
                            message: 'No se ha encontrado la solicitud.',
                            status: 404
                        });
                        _b.label = 8;
                    case 8: return [3 /*break*/, 10];
                    case 9:
                        e_12 = _b.sent();
                        /* istanbul ignore next */
                        console.log(e_12);
                        logger_service_1["default"].error("RequestController.apiCreateItem: Async Error.");
                        /* istanbul ignore next */
                        logger_service_1["default"].error("{user: {_id: " + req.user._id + ", email: " + req.user.email + "}}");
                        res.status(500).json(e_12);
                        return [3 /*break*/, 10];
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    RequestController.prototype.apiPatchItem = function (req, res) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var _b, team, company, updateObject, id, cancelRequest_1, requestItem, existCar, _c, existActivity, inventories, participants, requests, newCar, item, e_13;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        logger_service_1["default"].info("RequestController.apiPatchItem");
                        _b = req.user, team = _b.team, company = _b.company;
                        updateObject = req.body;
                        id = req.params.id;
                        logger_service_1["default"].info("{user: {_id: " + req.user._id + ", email: " + req.user.email + "}, body: " + JSON.stringify(updateObject) + " }");
                        _d.label = 1;
                    case 1:
                        _d.trys.push([1, 24, , 25]);
                        cancelRequest_1 = false;
                        req.on('close', function () {
                            cancelRequest_1 = true;
                        });
                        return [4 /*yield*/, requestItem_model_1["default"].findOneAndUpdate({
                                _id: id,
                                team: team
                            }, { $set: __assign({}, updateObject) }).populate([{ path: 'car' }, { path: 'request' }])];
                    case 2:
                        requestItem = _d.sent();
                        if (!Object.keys(updateObject.car).length) return [3 /*break*/, 21];
                        // add vin2 to car
                        updateObject.car.vin2 = updateObject.car && updateObject.car.vin ? updateObject.car.vin.substr(updateObject.car.vin.length - 6) : '';
                        if (!(((_a = updateObject.car.vin) === null || _a === void 0 ? void 0 : _a.length) >= 16)) return [3 /*break*/, 4];
                        return [4 /*yield*/, car_model_1["default"].findOne({ team: team, vin: updateObject.car.vin })];
                    case 3:
                        _c = _d.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        _c = false;
                        _d.label = 5;
                    case 5:
                        existCar = _c;
                        if (!(requestItem && ((updateObject.car.vin && updateObject.car.vin.length) || (updateObject.car.material && updateObject.car.material.length)))) return [3 /*break*/, 8];
                        return [4 /*yield*/, activityHistory_model_1["default"].findOne({ team: team, 'request.item': requestItem._id })];
                    case 6:
                        existActivity = _d.sent();
                        if (!!existActivity) return [3 /*break*/, 8];
                        return [4 /*yield*/, new activityHistory_model_1["default"]({
                                team: team,
                                company: company,
                                user: req.user._id,
                                type: activityHistory_model_1.ChoicesTypeActivity.request,
                                request: {
                                    _id: requestItem.request._id,
                                    item: requestItem._id,
                                    number: requestItem.request.number
                                }
                            }).save()];
                    case 7:
                        _d.sent();
                        _d.label = 8;
                    case 8:
                        if (!(existCar && requestItem && existCar.vin !== requestItem.car.vin)) return [3 /*break*/, 10];
                        // validate exist car and change vin
                        return [4 /*yield*/, requestItem_model_1["default"].update({ _id: id, team: team }, { $set: { car: existCar } })];
                    case 9:
                        // validate exist car and change vin
                        _d.sent();
                        return [3 /*break*/, 21];
                    case 10:
                        if (!(requestItem && requestItem.car.vin !== updateObject.car.vin)) return [3 /*break*/, 19];
                        return [4 /*yield*/, inventoryCar_model_1["default"].find({ car: requestItem.car }).count()];
                    case 11:
                        inventories = _d.sent();
                        return [4 /*yield*/, participant_model_1["default"].find({ team: team, car: requestItem.car }).count()];
                    case 12:
                        participants = _d.sent();
                        return [4 /*yield*/, requestItem_model_1["default"].find({ team: team, car: requestItem.car, _id: { $ne: requestItem._id } }).count()];
                    case 13:
                        requests = _d.sent();
                        if (!(inventories || participants || requests)) return [3 /*break*/, 16];
                        // validate car has actions in the system
                        delete updateObject.car._id;
                        return [4 /*yield*/, new car_model_1["default"](updateObject.car).save()];
                    case 14:
                        newCar = _d.sent();
                        return [4 /*yield*/, requestItem_model_1["default"].update({ _id: id, team: team }, { $set: { car: newCar } })];
                    case 15:
                        _d.sent();
                        return [3 /*break*/, 18];
                    case 16: return [4 /*yield*/, car_model_1["default"].update({ _id: updateObject.car._id, team: team }, { $set: updateObject.car })];
                    case 17:
                        _d.sent();
                        _d.label = 18;
                    case 18: return [3 /*break*/, 21];
                    case 19: return [4 /*yield*/, car_model_1["default"].update({ _id: updateObject.car._id, team: team }, { $set: updateObject.car })];
                    case 20:
                        _d.sent();
                        _d.label = 21;
                    case 21: return [4 /*yield*/, requestItem_model_1["default"]
                            .findOne({ _id: id, team: team })
                            .populate(this.itemPopulate)
                            .lean()];
                    case 22:
                        item = _d.sent();
                        return [4 /*yield*/, request_model_1["default"].update({ _id: item.request._id }, { $set: { updatedAt: moment() } })];
                    case 23:
                        _d.sent();
                        if (!cancelRequest_1) {
                            server_1.io.to("request-list-" + team._id).emit('UPDATE_REQUEST_ITEM', {
                                idRequest: item.request._id,
                                item: item
                            });
                        }
                        if (!cancelRequest_1) {
                            server_1.io.to("request-detail-" + team._id).emit('UPDATE_REQUEST_ITEM', {
                                idRequest: item.request._id,
                                item: item
                            });
                        }
                        res.status(200).json(__assign({}, item));
                        return [3 /*break*/, 25];
                    case 24:
                        e_13 = _d.sent();
                        /* istanbul ignore next */
                        logger_service_1["default"].error(e_13);
                        /* istanbul ignore next */
                        logger_service_1["default"].error("RequestController.apiPatchItem: Async Error.");
                        /* istanbul ignore next */
                        logger_service_1["default"].error("{user: {_id: " + req.user._id + ", email: " + req.user.email + "}}");
                        res.status(500).json(e_13);
                        return [3 /*break*/, 25];
                    case 25: return [2 /*return*/];
                }
            });
        });
    };
    RequestController.prototype.getRequets = function (filter, options) {
        return new Promise(function (resolve, reject) {
            request_model_1["default"].paginate(filter, options, function (err, result) {
                if (err) {
                    return reject(err);
                }
                return resolve(result);
            });
        });
    };
    RequestController.prototype.downloadItemFiles = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var id, team, requestItems, archive_1, filename_1, filesToDownload, filesToCompress, _loop_1, _i, _a, file, results, numb, _b, e_14;
            var _this = this;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        id = req.params.id;
                        team = req.user.team._id;
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 8, , 9]);
                        return [4 /*yield*/, requestItem_model_1["default"]
                                .findOne({ _id: id, team: team })
                                .populate(this.itemPopulate)];
                    case 2:
                        requestItems = _c.sent();
                        if (!requestItems) return [3 /*break*/, 6];
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
                        filename_1 = "attachments_" + requestItems._id + ".zip";
                        archive_1.on('end', function () {
                            console.log(filename_1 + ": Archive wrote " + (archive_1.pointer() / (1024 * 1024)).toFixed(2) + "MB");
                        });
                        res.attachment(filename_1);
                        filesToDownload = [];
                        filesToCompress = [];
                        _loop_1 = function (file) {
                            var destDirectory = "/tmp/" + file._id + "_" + file.file.name;
                            filesToDownload.push(function () { return _this.downloadFile(decodeURI(file.file.url), destDirectory); });
                            filesToCompress.push({
                                destDirectory: destDirectory,
                                name: file.file.name
                            });
                        };
                        for (_i = 0, _a = requestItems.files; _i < _a.length; _i++) {
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
                                    console.log("clear " + file.destDirectory);
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
                        e_14 = _c.sent();
                        /* istanbul ignore next */
                        logger_service_1["default"].error(e_14);
                        /* istanbul ignore next */
                        logger_service_1["default"].error("RequestController.downloadItemFiles: Async Error.");
                        /* istanbul ignore next */
                        logger_service_1["default"].error("{user: {_id: " + req.user._id + ", email: " + req.user.email + "}}");
                        res.status(500).json(e_14);
                        return [3 /*break*/, 9];
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    RequestController.prototype.downloadFile = function (url, dest) {
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
    RequestController.prototype.uploadFile = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var company, team, file, requestFile, e_15, e_16, e_17;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        company = req.user.company;
                        team = req.user.team._id;
                        logger_service_1["default"].info("RequestController.uploadFile");
                        logger_service_1["default"].info("{user: {_id: " + req.user._id + ", email: " + req.user.email + "}}");
                        file = general_utils_1["default"].getFileFromRequest(req.files, 'file');
                        if (!file) return [3 /*break*/, 15];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 13, , 14]);
                        requestFile = new requestFile_model_1["default"]();
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
                        requestFile.user = req.user._id;
                        requestFile.company = company._id;
                        if (!new RegExp('\\bimage\\b').test(file.mimetype)) return [3 /*break*/, 5];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, this.autoRotate(file.path)];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        e_15 = _a.sent();
                        logger_service_1["default"].error('RequestController.uploadFile: Error making autoRotate');
                        return [3 /*break*/, 5];
                    case 5: return [4 /*yield*/, requestFile.attach('file', file)];
                    case 6:
                        _a.sent();
                        if (!new RegExp('\\bimage\\b').test(file.mimetype)) return [3 /*break*/, 11];
                        _a.label = 7;
                    case 7:
                        _a.trys.push([7, 10, , 11]);
                        return [4 /*yield*/, this.resizeImage(file.path)];
                    case 8:
                        _a.sent();
                        return [4 /*yield*/, requestFile.attach('thumbnail', file)];
                    case 9:
                        _a.sent();
                        return [3 /*break*/, 11];
                    case 10:
                        e_16 = _a.sent();
                        logger_service_1["default"].error('RequestController.uploadFile: Error making thumbnail');
                        return [3 /*break*/, 11];
                    case 11: return [4 /*yield*/, requestFile.save()];
                    case 12:
                        _a.sent();
                        res.status(201).json({
                            data: {
                                _id: requestFile._id,
                                file: requestFile.file
                            },
                            status: 201
                        });
                        return [3 /*break*/, 14];
                    case 13:
                        e_17 = _a.sent();
                        /* istanbul ignore next */
                        logger_service_1["default"].error("RequestController.uploadFile: Async Error.");
                        /* istanbul ignore next */
                        logger_service_1["default"].error("{user: {_id: " + req.user._id + ", email: " + req.user.email + "}}");
                        /* istanbul ignore next */
                        logger_service_1["default"].error(e_17);
                        /* istanbul ignore next */
                        res.status(400).json(e_17);
                        return [3 /*break*/, 14];
                    case 14: return [3 /*break*/, 16];
                    case 15:
                        logger_service_1["default"].error("RequestController.uploadFile: The file are required.");
                        logger_service_1["default"].error("{user: {_id: " + req.user._id + ", email: " + req.user.email + "}}");
                        /* istanbul ignore next */
                        res.status(400).json({
                            message: 'La imagen es obligatoria.',
                            status: 400
                        });
                        _a.label = 16;
                    case 16: return [2 /*return*/];
                }
            });
        });
    };
    RequestController.prototype.autoRotate = function (path) {
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
    RequestController.prototype.resizeImage = function (path) {
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
    return RequestController;
}());
exports["default"] = new RequestController();
//# sourceMappingURL=request.controller.js.map