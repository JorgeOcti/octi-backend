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
var inventory_model_1 = require("../../../inventory/models/inventory.model");
var server_1 = require("../../../server");
var moment = require("moment");
var user_model_1 = require("../../models/user.model");
var venue_model_1 = require("../../models/venue.model");
var excel = require("exceljs");
var tempfile = require("tempfile");
var AdminVenueController = /** @class */ (function () {
    function AdminVenueController() {
        this.index = this.index.bind(this);
        this.getVenues = this.getVenues.bind(this);
        this.apiListVenues = this.apiListVenues.bind(this);
        this.apiCreateVenue = this.apiCreateVenue.bind(this);
        this.apiUpdateVenue = this.apiUpdateVenue.bind(this);
        this.apiDeleteVenue = this.apiDeleteVenue.bind(this);
    }
    AdminVenueController.prototype.index = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, _b, _c;
            var _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        if (!req.user.hasPermission('viewVenue')) return [3 /*break*/, 2];
                        _b = (_a = res).render;
                        _c = ['app/index'];
                        _d = {};
                        return [4 /*yield*/, req.user.generateToken()];
                    case 1:
                        _b.apply(_a, _c.concat([(_d.token = _e.sent(), _d)]));
                        return [3 /*break*/, 3];
                    case 2:
                        res.status(403).render('403');
                        _e.label = 3;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    AdminVenueController.prototype.accessByVenue = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var team, workbook, worksheetSend, sendColumns, sendRows, venues, _i, venues_1, venue, dataSend, _a, _b, to, tempFilePath;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        team = req.user.team._id;
                        workbook = new excel.Workbook();
                        worksheetSend = workbook.addWorksheet('Sucursales', {
                            properties: {
                                defaultRowHeight: 30
                            },
                            pageSetup: {
                                fitToPage: true, fitToHeight: 100, fitToWidth: 1
                            }
                        });
                        worksheetSend.views = [{
                                state: 'frozen',
                                xSplit: 1,
                                ySplit: 1,
                                topLeftCell: 'B2',
                                activeCell: 'A1'
                            }];
                        sendColumns = [{
                                header: 'Sucursal\r\n(FILAS ENVIAN / COLUMNAS RECIBEN)',
                                key: 'sucursal',
                                width: 30,
                                alignment: {
                                    wrapText: true
                                }
                            }];
                        sendRows = [];
                        return [4 /*yield*/, venue_model_1["default"].find({ deleted: false, team: team }).sort('name')];
                    case 1:
                        venues = _c.sent();
                        for (_i = 0, venues_1 = venues; _i < venues_1.length; _i++) {
                            venue = venues_1[_i];
                            sendColumns.push({
                                header: venue.name, key: venue._id.toString(), width: 5,
                                style: {
                                    alignment: {
                                        vertical: 'middle',
                                        horizontal: 'center'
                                    }
                                }
                            });
                            dataSend = {};
                            for (_a = 0, _b = venue.sendTo; _a < _b.length; _a++) {
                                to = _b[_a];
                                dataSend[to] = 'X';
                            }
                            sendRows.push(__assign({ sucursal: venue.name }, dataSend));
                        }
                        worksheetSend.columns = sendColumns;
                        worksheetSend.autoFilter = {
                            from: 'A1',
                            to: {
                                row: 1,
                                column: sendColumns.length
                            }
                        };
                        worksheetSend.addRows(sendRows);
                        worksheetSend.getColumn(1).eachCell(function (cell) {
                            cell.alignment = {
                                vertical: 'middle',
                                textRotation: 0,
                                wrapText: true
                            };
                            cell.font = {
                                bold: true
                            };
                        });
                        worksheetSend.getRow(1).eachCell(function (cell) {
                            var alignment = {
                                vertical: 'middle',
                                horizontal: 'center',
                                textRotation: 0,
                                wrapText: true
                            };
                            if (parseInt(cell.col, 10) !== 1) {
                                alignment.textRotation = 90;
                            }
                            cell.alignment = alignment;
                            cell.font = {
                                bold: true
                            };
                        });
                        tempFilePath = tempfile('.xlsx');
                        return [4 /*yield*/, workbook.xlsx.writeFile(tempFilePath)];
                    case 2:
                        _c.sent();
                        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                        res.setHeader('Content-Disposition', "attachment; filename=acceso-sucursales-" + moment().format('YYYY-MM-DD') + ".xlsx");
                        return [2 /*return*/, res.sendFile(tempFilePath)];
                }
            });
        });
    };
    AdminVenueController.prototype.apiListVenues = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var team, _a, page, pageSize, noPopulate, filted, search, options, filter, venues, e_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        team = req.user.team._id;
                        _a = req.query, page = _a.page, pageSize = _a.pageSize, noPopulate = _a.noPopulate, filted = _a.filted, search = _a.search;
                        options = {
                            select: {
                                _id: true,
                                name: true,
                                abbreviation: true,
                                lat: true,
                                lng: true,
                                receptionCarriers: true,
                                shippingCarriers: true,
                                shippingMaxDays: true,
                                sendToDays: true,
                                sendTo: true,
                                receiveFrom: true,
                                type: true,
                                updatedAt: true,
                                createdAt: true
                            },
                            populate: [{
                                    path: 'receptionCarriers',
                                    select: ['_id', 'name']
                                }, {
                                    path: 'shippingCarriers',
                                    select: ['_id', 'name']
                                }, {
                                    path: 'sendToDays.venue',
                                    select: ['_id', 'name']
                                }, {
                                    path: 'sendTo',
                                    select: ['_id', 'name']
                                }, {
                                    path: 'receiveFrom',
                                    select: ['_id', 'name']
                                }, {
                                    path: 'users',
                                    select: ['_id']
                                }, {
                                    path: 'participants',
                                    select: ['_id']
                                }, {
                                    path: 'region',
                                    select: ['name']
                                }, {
                                    path: 'company',
                                    select: ['name', 'marker']
                                }],
                            lean: true,
                            sort: {
                                name: 1
                            },
                            page: parseInt(page ? page : '1', 10),
                            limit: parseInt(pageSize ? pageSize : '20', 10)
                        };
                        filter = {
                            deleted: false,
                            team: team
                        };
                        if (noPopulate) {
                            delete options.populate;
                        }
                        if (filted) {
                            filter._id = {
                                $in: req.user.venuesPermissions()
                            };
                        }
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.getVenues(filter, options, search)];
                    case 2:
                        venues = _b.sent();
                        /* istanbul ignore if  */
                        if (options.page && venues.pages && venues.pages < options.page) {
                            res.status(400).json({
                                message: 'La página solicitada no existe.',
                                status: 400
                            });
                        }
                        else {
                            res.json({
                                count: venues.total,
                                pages: venues.pages,
                                hasPrevious: options.page && options.page > 1 && venues.pages && venues.pages >= options.page,
                                hasNext: options.page && venues.pages && venues.pages > options.page,
                                results: venues.docs,
                                status: 200
                            });
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        e_1 = _b.sent();
                        /* istanbul ignore next  */
                        if (e_1) {
                            res.status(500).json(e_1);
                        }
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    AdminVenueController.prototype.apiCreateVenue = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, name, abbreviation, lat, lng, type, company, sendToDays, receiveFrom, shippingMaxDays, receptionCarriers, shippingCarriers, region, sendTo, team, existVenue, newVenue, id, _b, _c, e_2;
            var _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        if (!req.user.hasPermission('addVenue')) {
                            return [2 /*return*/, res.status(403).json({
                                    message: 'No tienes permisos para esta operación'
                                })];
                        }
                        _a = req.body, name = _a.name, abbreviation = _a.abbreviation, lat = _a.lat, lng = _a.lng, type = _a.type, company = _a.company, sendToDays = _a.sendToDays, receiveFrom = _a.receiveFrom, shippingMaxDays = _a.shippingMaxDays, receptionCarriers = _a.receptionCarriers, shippingCarriers = _a.shippingCarriers, region = _a.region;
                        sendTo = sendToDays.map(function (venueDay) { return venueDay.venue._id; });
                        team = req.user.team._id;
                        if (!name || !name.trim().length) {
                            res.status(400).json({
                                message: 'El nombre es requerido.',
                                status: 400
                            });
                        }
                        _e.label = 1;
                    case 1:
                        _e.trys.push([1, 11, , 12]);
                        return [4 /*yield*/, venue_model_1["default"].find({
                                name: name,
                                team: team
                            })];
                    case 2:
                        existVenue = _e.sent();
                        if (!existVenue.length) return [3 /*break*/, 3];
                        res.status(400).json({
                            message: 'Sucursal ya existe.',
                            status: 400
                        });
                        return [3 /*break*/, 10];
                    case 3: return [4 /*yield*/, new venue_model_1["default"]({
                            name: name,
                            abbreviation: abbreviation,
                            lat: lat,
                            lng: lng,
                            team: team,
                            company: company,
                            region: region,
                            shippingMaxDays: shippingMaxDays,
                            sendToDays: sendToDays,
                            sendTo: sendTo,
                            receiveFrom: receiveFrom,
                            receptionCarriers: receptionCarriers,
                            shippingCarriers: shippingCarriers,
                            type: type
                        }).save()];
                    case 4:
                        newVenue = _e.sent();
                        id = newVenue._id;
                        return [4 /*yield*/, venue_model_1["default"].update({ _id: { $in: receiveFrom }, team: team, sendTo: { $ne: id } }, { $push: { sendTo: id } }, { multi: true })];
                    case 5:
                        _e.sent();
                        return [4 /*yield*/, venue_model_1["default"].update({ _id: { $nin: receiveFrom }, team: team, sendTo: id }, { $pull: { sendTo: id } }, { multi: true })];
                    case 6:
                        _e.sent();
                        return [4 /*yield*/, venue_model_1["default"].update({ _id: { $in: sendTo }, team: team, receiveFrom: { $ne: id } }, { $push: { receiveFrom: id } }, { multi: true })];
                    case 7:
                        _e.sent();
                        return [4 /*yield*/, venue_model_1["default"].update({ _id: { $nin: sendTo }, team: team, receiveFrom: id }, { $pull: { receiveFrom: id } }, { multi: true })];
                    case 8:
                        _e.sent();
                        server_1.io.to("venue-list-" + team).emit('REFRESH', {
                            update: true,
                            updatedBy: req.user._id
                        });
                        _c = (_b = res.status(201)).json;
                        _d = {
                            message: 'Sucursal agregada satisfactoriamente.'
                        };
                        return [4 /*yield*/, newVenue.populate([{
                                    path: 'company',
                                    select: ['_id', 'name']
                                }, {
                                    path: 'region',
                                    select: ['_id', 'name']
                                }, {
                                    path: 'sendTo',
                                    select: ['_id', 'name']
                                }, {
                                    path: 'receiveFrom',
                                    select: ['_id', 'name']
                                }, {
                                    path: 'receptionCarriers',
                                    select: ['_id', 'name']
                                }, {
                                    path: 'shippingCarriers',
                                    select: ['_id', 'name']
                                }])];
                    case 9:
                        _c.apply(_b, [(_d.venue = _e.sent(),
                                _d)]);
                        _e.label = 10;
                    case 10: return [3 /*break*/, 12];
                    case 11:
                        e_2 = _e.sent();
                        /* istanbul ignore next  */
                        console.log(e_2);
                        /* istanbul ignore next  */
                        res.status(500).json(e_2);
                        return [3 /*break*/, 12];
                    case 12: return [2 /*return*/];
                }
            });
        });
    };
    AdminVenueController.prototype.apiUpdateVenue = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var id, team, _a, name, abbreviation, lat, lng, type, company, sendToDays, receiveFrom, receptionCarriers, shippingCarriers, region, shippingMaxDays, sendTo, venue, response, response, e_3;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        /* istanbul ignore next  */
                        if (!req.user.hasPermission('changeVenue')) {
                            return [2 /*return*/, res.status(403).json({
                                    message: 'No tienes permisos para esta operación'
                                })];
                        }
                        id = req.params.id;
                        team = req.user.team._id;
                        _a = req.body, name = _a.name, abbreviation = _a.abbreviation, lat = _a.lat, lng = _a.lng, type = _a.type, company = _a.company, sendToDays = _a.sendToDays, receiveFrom = _a.receiveFrom, receptionCarriers = _a.receptionCarriers, shippingCarriers = _a.shippingCarriers, region = _a.region, shippingMaxDays = _a.shippingMaxDays;
                        sendTo = sendToDays.map(function (venueDay) { return venueDay.venue._id; });
                        if (!name || !name.length) {
                            res.status(400).json({
                                message: 'The name is are required',
                                status: 400
                            });
                        }
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 10, , 11]);
                        return [4 /*yield*/, venue_model_1["default"].findOneAndUpdate({
                                _id: id,
                                team: team
                            }, {
                                name: name,
                                abbreviation: abbreviation,
                                lat: lat,
                                lng: lng,
                                company: company,
                                region: region,
                                shippingMaxDays: shippingMaxDays,
                                sendToDays: sendToDays,
                                sendTo: sendTo,
                                receiveFrom: receiveFrom,
                                shippingCarriers: shippingCarriers,
                                receptionCarriers: receptionCarriers,
                                type: type
                            }, {
                                "new": true
                            }).populate([{
                                    path: 'company',
                                    select: ['_id', 'name']
                                }, {
                                    path: 'region',
                                    select: ['_id', 'name']
                                }, {
                                    path: 'sendTo',
                                    select: ['_id', 'name']
                                }, {
                                    path: 'receiveFrom',
                                    select: ['_id', 'name']
                                }, {
                                    path: 'receptionCarriers',
                                    select: ['_id', 'name']
                                }, {
                                    path: 'shippingCarriers',
                                    select: ['_id', 'name']
                                }])];
                    case 2:
                        venue = _b.sent();
                        if (!venue) return [3 /*break*/, 8];
                        // fix the "company" to users in this venue
                        return [4 /*yield*/, user_model_1["default"].update({ venue: id }, { company: venue.company._id }, { multi: true })];
                    case 3:
                        // fix the "company" to users in this venue
                        _b.sent();
                        // reverse assing send to and reveive from
                        return [4 /*yield*/, venue_model_1["default"].update({ _id: { $in: receiveFrom }, team: team, sendTo: { $ne: id } }, { $push: { sendTo: id } }, { multi: true })];
                    case 4:
                        // reverse assing send to and reveive from
                        _b.sent();
                        return [4 /*yield*/, venue_model_1["default"].update({ _id: { $nin: receiveFrom }, team: team, sendTo: id }, { $pull: { sendTo: id } }, { multi: true })];
                    case 5:
                        _b.sent();
                        return [4 /*yield*/, venue_model_1["default"].update({ _id: { $in: sendTo }, team: team, receiveFrom: { $ne: id } }, { $push: { receiveFrom: id } }, { multi: true })];
                    case 6:
                        _b.sent();
                        return [4 /*yield*/, venue_model_1["default"].update({ _id: { $nin: sendTo }, team: team, receiveFrom: id }, { $pull: { receiveFrom: id } }, { multi: true })];
                    case 7:
                        _b.sent();
                        response = {
                            message: 'Sucursal editada satisfactoriamente.',
                            venue: venue
                        };
                        server_1.io.to("venue-list-" + team).emit('REFRESH', {
                            update: true,
                            updatedBy: req.user._id
                        });
                        res.status(200).json(response);
                        return [3 /*break*/, 9];
                    case 8:
                        response = {
                            id: id,
                            message: 'Sucursal no encontrada'
                        };
                        res.status(400).json(response);
                        _b.label = 9;
                    case 9: return [3 /*break*/, 11];
                    case 10:
                        e_3 = _b.sent();
                        /* istanbul ignore next  */
                        console.log(e_3);
                        /* istanbul ignore next  */
                        res.status(500).json(e_3);
                        return [3 /*break*/, 11];
                    case 11: return [2 /*return*/];
                }
            });
        });
    };
    AdminVenueController.prototype.apiDeleteVenue = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var id, company, team, inventories, textInventories, venue, response, response, e_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!req.user.hasPermission('deleteVenue')) {
                            return [2 /*return*/, res.status(403).json({
                                    message: 'No tienes permisos para esta operación'
                                })];
                        }
                        id = req.params.id;
                        company = req.user.company;
                        team = req.user.team._id;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 13, , 14]);
                        return [4 /*yield*/, inventory_model_1["default"].find({
                                $or: [{
                                        venues: id
                                    }, {
                                        'cars.venue': id
                                    }, {
                                        'cars.venueFound': id
                                    }],
                                company: company
                            }, {
                                name: true
                            })];
                    case 2:
                        inventories = _a.sent();
                        if (!(inventories && inventories.length)) return [3 /*break*/, 3];
                        textInventories = inventories.map(function (inventory) { return (inventory.name); }).join('\n- ');
                        res.status(400).json({
                            message: "La sucursal no ha podido ser eliminada porque est\u00E1 utilizada en los siguientes inventarios : \n- " + textInventories
                        });
                        return [3 /*break*/, 12];
                    case 3: return [4 /*yield*/, venue_model_1["default"].findOne({
                            _id: id,
                            team: team
                        }).populate([{
                                path: 'users',
                                select: ['_id']
                            }, {
                                path: 'participants',
                                select: ['_id']
                            }])];
                    case 4:
                        venue = _a.sent();
                        if (!venue) return [3 /*break*/, 11];
                        if (!(venue.users && venue.users.length)) return [3 /*break*/, 5];
                        res.status(400).json({
                            message: 'La sucursal no ha podido ser eliminada porque aún tiene usuarios asignados.'
                        });
                        return [3 /*break*/, 10];
                    case 5:
                        if (!(venue.participants && venue.participants.length)) return [3 /*break*/, 6];
                        res.status(400).json({
                            message: 'La sucursal no ha podido ser eliminada porque aún tiene revisiones asignadas.'
                        });
                        return [3 /*break*/, 10];
                    case 6: return [4 /*yield*/, venue.remove()];
                    case 7:
                        _a.sent();
                        // clear venues
                        return [4 /*yield*/, venue_model_1["default"].update({ team: team, sendTo: id }, { $pull: { sendTo: id } }, { multi: true })];
                    case 8:
                        // clear venues
                        _a.sent();
                        return [4 /*yield*/, venue_model_1["default"].update({ team: team, receiveFrom: id }, { $pull: { receiveFrom: id } }, { multi: true })];
                    case 9:
                        _a.sent();
                        response = {
                            message: 'Sucursal eliminada satisfactoriamente.',
                            id: venue._id
                        };
                        server_1.io.to("venue-list-" + team).emit('REFRESH', {
                            update: true,
                            updatedBy: req.user._id
                        });
                        res.status(200).json(response);
                        _a.label = 10;
                    case 10: return [3 /*break*/, 12];
                    case 11:
                        response = {
                            id: id,
                            message: 'Esta sucursal ya ha sido eliminada.'
                        };
                        res.status(200).json(response);
                        _a.label = 12;
                    case 12: return [3 /*break*/, 14];
                    case 13:
                        e_4 = _a.sent();
                        /* istanbul ignore next  */
                        res.status(500).json(e_4);
                        return [3 /*break*/, 14];
                    case 14: return [2 /*return*/];
                }
            });
        });
    };
    AdminVenueController.prototype.getVenues = function (filter, options, search) {
        if (search && search.length) {
            var searchText = new RegExp(search, 'i');
            filter = {
                $and: [{
                        name: { $regex: searchText }
                    }, filter]
            };
        }
        return new Promise(function (resolve, reject) {
            venue_model_1["default"].paginate(filter, options, function (err, result) {
                /* istanbul ignore next  */
                if (err) {
                    return reject(err);
                }
                return resolve(result);
            });
        });
    };
    return AdminVenueController;
}());
exports["default"] = new AdminVenueController();
//# sourceMappingURL=venue.admin.controller.js.map