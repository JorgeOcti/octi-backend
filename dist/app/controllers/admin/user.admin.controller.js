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
var excel = require("exceljs");
var tempfile = require("tempfile");
var app_1 = require("../../../app");
var server_1 = require("../../../server");
var user_model_1 = require("../../models/user.model");
var venue_model_1 = require("../../models/venue.model");
var AdminUsersController = /** @class */ (function () {
    function AdminUsersController() {
        this.index = this.index.bind(this);
        this.apiUsers = this.apiUsers.bind(this);
        this.apiCreateUser = this.apiCreateUser.bind(this);
        this.apiUpdateUser = this.apiUpdateUser.bind(this);
        this.apiDeleteUser = this.apiDeleteUser.bind(this);
        this.exportXLS = this.exportXLS.bind(this);
        this.apiChangePasswordUser = this.apiChangePasswordUser.bind(this);
    }
    AdminUsersController.prototype.index = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, _b, _c;
            var _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        if (!req.user.hasPermission('viewUser')) return [3 /*break*/, 2];
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
    AdminUsersController.prototype.exportXLS = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var team, workbook, worksheet_1, worksheetAccess, accessColumns, accessRow_1, venues, _i, venues_1, venue, users, tempFilePath, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!req.user.hasPermission('viewUser')) {
                            return [2 /*return*/, res.status(403).json({
                                    message: 'No tienes permisos para esta operación'
                                })];
                        }
                        team = req.user.team._id;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 5, , 6]);
                        workbook = new excel.Workbook();
                        worksheet_1 = workbook.addWorksheet('Usuarios', {
                            properties: {
                                defaultRowHeight: 30
                            }, pageSetup: {
                                fitToPage: true, fitToHeight: 100, fitToWidth: 1
                            }
                        });
                        worksheet_1.autoFilter = { from: 'A1', to: 'F1' };
                        worksheetAccess = workbook.addWorksheet('Accesos', {
                            properties: {
                                defaultRowHeight: 30
                            }, pageSetup: {
                                fitToPage: true, fitToHeight: 100, fitToWidth: 1
                            }
                        });
                        worksheetAccess.views = [{
                                state: 'frozen',
                                xSplit: 1,
                                ySplit: 1,
                                topLeftCell: 'B2',
                                activeCell: 'A1'
                            }];
                        accessColumns = [{
                                header: 'Usuario',
                                key: 'usuario',
                                width: 30,
                                alignment: {
                                    wrapText: true
                                }
                            }];
                        accessRow_1 = [];
                        return [4 /*yield*/, venue_model_1["default"].find({ team: team, deleted: false }).sort('name')];
                    case 2:
                        venues = _a.sent();
                        for (_i = 0, venues_1 = venues; _i < venues_1.length; _i++) {
                            venue = venues_1[_i];
                            accessColumns.push({
                                header: venue.name, key: venue._id.toString(), width: 5,
                                style: {
                                    alignment: {
                                        vertical: 'middle',
                                        horizontal: 'center'
                                    }
                                }
                            });
                        }
                        worksheetAccess.columns = accessColumns;
                        worksheetAccess.autoFilter = {
                            from: 'A1',
                            to: {
                                row: 1,
                                column: accessColumns.length
                            }
                        };
                        worksheetAccess.getColumn(1).eachCell(function (cell) {
                            cell.alignment = {
                                vertical: 'middle',
                                textRotation: 0,
                                wrapText: true
                            };
                            cell.font = {
                                bold: true
                            };
                        });
                        worksheetAccess.getRow(1).eachCell(function (cell) {
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
                        /* headers */
                        worksheet_1.columns = [{
                                header: 'Nombre', key: 'name', width: 30
                            }, {
                                header: 'Correo', key: 'email', width: 30
                            }, {
                                header: 'Sucursal', key: 'venue', width: 30
                            }, {
                                header: 'Empresa', key: 'company', width: 20
                            }, {
                                header: 'Creado', key: 'created', width: 21, style: { numFmt: 'dd/mm/yyyy hh:mm' }
                            }, {
                                header: 'Último inicio de sesión', key: 'lastLogin', width: 21, style: { numFmt: 'dd/mm/yyyy hh:mm' }
                            }];
                        return [4 /*yield*/, user_model_1["default"].find({
                                team: team,
                                venue: {
                                    $in: req.user.venuesPermissions()
                                }
                            }).populate([{
                                    path: 'venuesAccess',
                                    select: ['name'],
                                    populate: [{
                                            path: 'company',
                                            select: ['name']
                                        }]
                                }, {
                                    path: 'venue',
                                    select: ['name', 'active'],
                                    populate: [{
                                            path: 'company',
                                            select: ['name']
                                        }]
                                }]).sort('firstName')];
                    case 3:
                        users = _a.sent();
                        users.forEach(function (user) {
                            var detailUser = {
                                name: user.fullName(),
                                email: user.email,
                                created: user.createdAt,
                                lastLogin: user.lastLogin
                            };
                            worksheet_1.addRow(__assign(__assign({}, detailUser), { venue: user.venue ? user.venue.name : '', company: user.venue && user.venue.company ? user.venue.company.name : '' }));
                            var dataVenues = {};
                            user.venuesPermissions(true).forEach(function (venue) {
                                dataVenues[venue] = 'X';
                                // worksheet.addRow({
                                //   ...detailUser,
                                //   venue: venue.name,
                                //   company: venue.company.name
                                // });
                            });
                            accessRow_1.push(__assign({ usuario: user.fullName() }, dataVenues));
                        });
                        worksheetAccess.addRows(accessRow_1);
                        /* formats */
                        worksheet_1.getRow(1).eachCell(function (cell) {
                            cell.font = {
                                bold: true
                            };
                        });
                        tempFilePath = tempfile('.xlsx');
                        return [4 /*yield*/, workbook.xlsx.writeFile(tempFilePath)];
                    case 4:
                        _a.sent();
                        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                        res.setHeader('Content-Disposition', 'attachment; filename=usuarios-21-03-2019.xlsx');
                        return [2 /*return*/, res.sendFile(tempFilePath)];
                    case 5:
                        e_1 = _a.sent();
                        console.log(e_1);
                        return [2 /*return*/, res.status(500).json({
                                message: 'Ha ocurrido un error. Comunicate con soporte para que te ayudemos a solucionarlo.'
                            })];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    AdminUsersController.prototype.apiUsers = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, page, pageSize, search, venue, minified, team, options, filter, users, e_2;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!req.user.hasPermission('viewUser')) {
                            return [2 /*return*/, res.status(403).json({
                                    message: 'No tienes permisos para esta operación'
                                })];
                        }
                        _a = req.query, page = _a.page, pageSize = _a.pageSize, search = _a.search, venue = _a.venue, minified = _a.minified;
                        team = req.user.team._id;
                        options = {
                            select: {
                                firstName: true,
                                lastName: true,
                                preferred: true,
                                email: true,
                                settings: true,
                                isAdmin: true,
                                isDriver: true,
                                updatedAt: true
                            },
                            sort: {
                                firstName: 1,
                                lastName: 1
                            },
                            page: parseInt(page ? page : '1', 10),
                            limit: parseInt(pageSize ? pageSize : '20', 10)
                        };
                        if (minified === '0') {
                            options.populate = [{
                                    path: 'venue',
                                    select: ['name', 'active']
                                }, {
                                    path: 'userPermissions',
                                    select: ['name', 'codeName'],
                                    options: {
                                        sort: {
                                            name: 1
                                        }
                                    }
                                }, {
                                    path: 'userForms',
                                    select: ['name']
                                }, {
                                    path: 'company',
                                    select: ['name']
                                }, {
                                    path: 'venuesAccess',
                                    select: ['name'],
                                    populate: [{
                                            path: 'company',
                                            select: ['name']
                                        }]
                                }];
                        }
                        filter = { team: team };
                        filter = venue ? __assign(__assign({}, filter), { $or: [{ venue: venue }, { venuesAccess: venue }] }) : __assign(__assign({}, filter), { venue: { $in: req.user.venuesPermissions() } });
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.getUsers(filter, options, search)];
                    case 2:
                        users = _b.sent();
                        // validate exist page
                        /* istanbul ignore if  */
                        if (options.page && users.pages && users.pages < options.page) {
                            res.status(400).json({
                                error: 'La página solicitada no existe.',
                                status: 200
                            });
                        }
                        else {
                            res.json({
                                count: users.total,
                                pages: users.pages,
                                hasPrevious: options.page && options.page > 1 && users.pages && users.pages >= options.page,
                                hasNext: options.page && users.pages && users.pages > options.page,
                                results: users.docs,
                                status: 200
                            });
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        e_2 = _b.sent();
                        /* istanbul ignore next  */
                        if (e_2) {
                            res.status(500).json(e_2);
                        }
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    AdminUsersController.prototype.apiCreateUser = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, firstName, lastName, email, venue, userPermissions, userForms, preferred, company, venuesAccess, team, existUser, password, newUser, fullname, e_3;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        /* istanbul ignore next  */
                        if (!req.user.hasPermission('addUser')) {
                            return [2 /*return*/, res.status(403).json({
                                    message: 'No tienes permisos para esta operación'
                                })];
                        }
                        _a = req.body, firstName = _a.firstName, lastName = _a.lastName, email = _a.email, venue = _a.venue, userPermissions = _a.userPermissions, userForms = _a.userForms, preferred = _a.preferred, company = _a.company, venuesAccess = _a.venuesAccess;
                        team = req.user.team._id;
                        // validate fields required
                        if (!firstName || !firstName.length || !lastName || !lastName.length || !email || !email.length || !venue || !venue.length) {
                            res.status(400).json({
                                message: 'firstName, lastName, email and venue are required',
                                status: 400
                            });
                        }
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 6, , 7]);
                        return [4 /*yield*/, user_model_1["default"].find({ $or: [{ email: email }, { username: email }] })];
                    case 2:
                        existUser = _b.sent();
                        if (!existUser.length) return [3 /*break*/, 3];
                        res.status(400).json({
                            message: 'Usuario ya existe con este email.',
                            status: 400
                        });
                        return [3 /*break*/, 5];
                    case 3:
                        password = Math.random().toString(36).slice(-8);
                        return [4 /*yield*/, new user_model_1["default"]({
                                firstName: firstName,
                                lastName: lastName,
                                username: email,
                                venue: venue,
                                venuesAccess: venuesAccess,
                                preferred: preferred,
                                userPermissions: userPermissions && userPermissions.length ? userPermissions.map(function (userPermission) { return userPermission._id; }) : [],
                                userForms: userForms && userForms.length ? userForms.map(function (userForm) { return userForm._id; }) : [],
                                company: company,
                                team: team,
                                password: password,
                                email: email,
                                active: true
                            }).save()];
                    case 4:
                        newUser = _b.sent();
                        fullname = newUser.fullName();
                        app_1.queue.create('email', {
                            from: '',
                            title: "Welcome email for ".concat(fullname),
                            to: "\"".concat(fullname, "\"<").concat(newUser.email, ">"),
                            subject: "".concat(fullname, " bienvenido(a) a OSA Andes"),
                            text: "".concat(fullname, " bienvenido(a) a OSA Andes\n          {Empresa} te da la bienvenida a usar OSA Andes.\n\n          Tus Datos para acceder a la aplicaci\u00F3n son:\n          Usuario: ").concat(newUser.email, "\n          Contrase\u00F1a ").concat(password, "\n          En caso de dudas o consultas puedes contactarte asoporte@osacontrol.com o a nuestro twitter @TaskforceOSA.\n\n          \u00A9 2021 OSA SpA. All rights reserved."),
                            view: 'account/welcome',
                            context: {
                                fullname: fullname,
                                username: newUser.email,
                                password: password
                            }
                        }).priority('high').attempts(5).save();
                        // prevent return password
                        newUser = newUser.toObject();
                        delete newUser.password;
                        server_1.io.to("user-list-".concat(team)).emit('REFRESH', {
                            update: true,
                            updatedBy: req.user._id
                        });
                        res.status(201).json({
                            message: 'Usuario agregado satisfactoriamente.',
                            user: newUser
                        });
                        _b.label = 5;
                    case 5: return [3 /*break*/, 7];
                    case 6:
                        e_3 = _b.sent();
                        /* istanbul ignore next  */
                        res.status(500).json(e_3);
                        return [3 /*break*/, 7];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    AdminUsersController.prototype.apiUpdateUser = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var id, team, _a, firstName, lastName, email, venue, venuesAccess, userPermissions, userForms, preferred, company, isAdmin, isDriver, settings, countUser, updateItems, user, user_venues, response, response, e_4;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        /* istanbul ignore next  */
                        if (!req.user.hasPermission('changeUser') && !req.user.isAdmin) {
                            return [2 /*return*/, res.status(403).json({
                                    message: 'No tienes permisos para esta operación'
                                })];
                        }
                        id = req.params.id;
                        team = req.user.team._id;
                        _a = req.body, firstName = _a.firstName, lastName = _a.lastName, email = _a.email, venue = _a.venue, venuesAccess = _a.venuesAccess, userPermissions = _a.userPermissions, userForms = _a.userForms, preferred = _a.preferred, company = _a.company, isAdmin = _a.isAdmin, isDriver = _a.isDriver, settings = _a.settings;
                        // validate fields required
                        if (!firstName || !firstName.length || !lastName || !lastName.length || !email || !email.length || !venue || !venue.length) {
                            res.status(400).json({
                                message: 'firstName, lastName, email and venue are required',
                                status: 400
                            });
                        }
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 8, , 9]);
                        return [4 /*yield*/, user_model_1["default"].count({ email: email, _id: { $ne: id } })];
                    case 2:
                        countUser = _b.sent();
                        if (!countUser) return [3 /*break*/, 3];
                        res.status(400).json({
                            message: 'Usuario ya existe con este email.',
                            status: 400
                        });
                        return [3 /*break*/, 7];
                    case 3:
                        updateItems = {
                            firstName: firstName,
                            lastName: lastName,
                            company: company,
                            preferred: preferred,
                            settings: settings,
                            userForms: userForms && userForms.length ? userForms.map(function (userForm) { return userForm._id; }) : [],
                            venue: venue,
                            venuesAccess: venuesAccess,
                            isDriver: isDriver
                        };
                        if ((req.user.isAdmin && [true, false].includes(isAdmin)) || req.user.hasPermission("changeTeamPermissions")) {
                            updateItems.userPermissions = userPermissions && userPermissions.length ? userPermissions.map(function (userPermission) { return userPermission._id; }) : [];
                            updateItems.isAdmin = isAdmin;
                        }
                        return [4 /*yield*/, user_model_1["default"]
                                .findOneAndUpdate({
                                _id: id,
                                team: team
                            }, updateItems, {
                                "new": true
                            })
                                .populate([{
                                    path: 'company',
                                    select: ['name']
                                }, {
                                    path: 'venue',
                                    select: ['name', 'active']
                                }, {
                                    path: 'venuesAccess',
                                    select: ['name'],
                                    populate: [{
                                            path: 'company',
                                            select: ['name']
                                        }]
                                }, {
                                    path: 'userPermissions',
                                    select: ['name', 'codeName'],
                                    options: {
                                        sort: {
                                            name: 1
                                        }
                                    }
                                }, {
                                    path: 'userForms',
                                    select: ['name']
                                }])];
                    case 4:
                        user = _b.sent();
                        if (!user) return [3 /*break*/, 6];
                        // prevent return password
                        user = user.toObject();
                        if (user && user.password) {
                            delete user.password;
                        }
                        user_venues = user === null || user === void 0 ? void 0 : user.venuesAccess.map(function (v) { return v._id; }).concat([user.venue._id]);
                        return [4 /*yield*/, venue_model_1["default"].update({ responsible: user === null || user === void 0 ? void 0 : user._id, _id: { $nin: user_venues } }, { $pull: { 'responsible': user === null || user === void 0 ? void 0 : user._id } })];
                    case 5:
                        _b.sent();
                        response = {
                            message: 'Usuario editado satisfactoriamente.',
                            user: user
                        };
                        server_1.io.to("user-list-".concat(team)).emit('REFRESH', {
                            update: true,
                            updatedBy: req.user._id
                        });
                        res.status(200).json(response);
                        return [3 /*break*/, 7];
                    case 6:
                        response = {
                            id: id,
                            message: 'Usuario no encontrado'
                        };
                        res.status(200).json(response);
                        _b.label = 7;
                    case 7: return [3 /*break*/, 9];
                    case 8:
                        e_4 = _b.sent();
                        /* istanbul ignore next  */
                        console.log(e_4);
                        /* istanbul ignore next  */
                        res.status(500).json(e_4);
                        return [3 /*break*/, 9];
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    AdminUsersController.prototype.apiDeleteUser = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var team, id, user, response, response, e_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!req.user.hasPermission('deleteUser')) {
                            return [2 /*return*/, res.status(403).json({
                                    message: 'No tienes permisos para esta operación'
                                })];
                        }
                        team = req.user.team._id;
                        id = req.params.id;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 6, , 7]);
                        return [4 /*yield*/, user_model_1["default"].findOneAndRemove({ _id: id, team: team })];
                    case 2:
                        user = _a.sent();
                        if (!user) return [3 /*break*/, 4];
                        // Delete user from venue responsible where has not access
                        return [4 /*yield*/, venue_model_1["default"].update({ responsible: user === null || user === void 0 ? void 0 : user._id }, { $pull: { 'responsible': user === null || user === void 0 ? void 0 : user._id } })];
                    case 3:
                        // Delete user from venue responsible where has not access
                        _a.sent();
                        response = {
                            message: 'Usuario eliminado satisfactoriamente.',
                            id: user._id
                        };
                        server_1.io.to("user-list-".concat(team)).emit('REFRESH', {
                            update: true,
                            updatedBy: req.user._id
                        });
                        res.status(200).json(response);
                        return [3 /*break*/, 5];
                    case 4:
                        response = {
                            id: id,
                            message: 'Este usuario ya fue eliminado.'
                        };
                        res.status(200).json(response);
                        _a.label = 5;
                    case 5: return [3 /*break*/, 7];
                    case 6:
                        e_5 = _a.sent();
                        /* istanbul ignore next  */
                        res.status(500).json(e_5);
                        return [3 /*break*/, 7];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    AdminUsersController.prototype.apiChangePasswordUser = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, user, password, team, affectedUser, e_6;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = req.body, user = _a.user, password = _a.password;
                        team = req.user.team._id;
                        if (!req.user.hasPermission('changeUser')) {
                            return [2 /*return*/, res.status(403).json({
                                    message: 'No tienes permisos para esta operación'
                                })];
                        }
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 5, , 6]);
                        if (!(password && password.length >= 6)) return [3 /*break*/, 3];
                        return [4 /*yield*/, user_model_1["default"].findOne({ _id: user, team: team })];
                    case 2:
                        affectedUser = _b.sent();
                        if (affectedUser) {
                            affectedUser.password = password;
                            affectedUser.save();
                            res.status(200).json({
                                message: 'Contraseña cambiada satisfactoriamente.',
                                status: 200
                            });
                        }
                        else {
                            res.status(400).json({
                                message: 'No se ha podido cambiar la contraseña',
                                status: 400
                            });
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        res.status(400).json({
                            message: 'La contraseña no cumple los requisitos mínimos.',
                            status: 400
                        });
                        _b.label = 4;
                    case 4: return [3 /*break*/, 6];
                    case 5:
                        e_6 = _b.sent();
                        /* istanbul ignore next  */
                        res.status(500).json(e_6);
                        return [3 /*break*/, 6];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    AdminUsersController.prototype.getUsers = function (filter, options, search) {
        if (search && search.length) {
            var searchText = new RegExp(search, 'i');
            filter = {
                $and: [{
                        $or: [{
                                firstName: { $regex: searchText }
                            }, {
                                lastName: { $regex: searchText }
                            }]
                    }, filter]
            };
        }
        return new Promise(function (resolve, reject) {
            user_model_1["default"].paginate(filter, options, function (err, result) {
                /* istanbul ignore next  */
                if (err) {
                    return reject(err);
                }
                return resolve(result);
            });
        });
    };
    return AdminUsersController;
}());
exports["default"] = new AdminUsersController();
//# sourceMappingURL=user.admin.controller.js.map