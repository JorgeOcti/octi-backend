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
var general_utils_1 = require("../../../utils/general.utils");
var company_model_1 = require("../../models/company.model");
var AdminCompaniesController = /** @class */ (function () {
    function AdminCompaniesController() {
        this.index = this.index.bind(this);
        this.getCompanies = this.getCompanies.bind(this);
        this.apiListCompanies = this.apiListCompanies.bind(this);
        this.apiCreateCompany = this.apiCreateCompany.bind(this);
        this.apiUpdateCompany = this.apiUpdateCompany.bind(this);
        this.apiDeleteCompany = this.apiDeleteCompany.bind(this);
    }
    AdminCompaniesController.prototype.index = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, _b, _c;
            var _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        if (!req.user.hasPermission('viewCompany')) return [3 /*break*/, 2];
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
    AdminCompaniesController.prototype.apiListCompanies = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var team, _a, page, pageSize, search, options, companies;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!req.user.hasPermission('viewCompany') && !req.user.hasPermission('viewUser')) {
                            return [2 /*return*/, res.status(403).json({
                                    message: 'No tienes permisos para esta operación'
                                })];
                        }
                        team = req.user.team._id;
                        _a = req.query, page = _a.page, pageSize = _a.pageSize, search = _a.search;
                        options = {
                            // select: {
                            //   name: true,
                            //   image: true,
                            //   updatedAt: true,
                            //   createdAt: true
                            // },
                            sort: {
                                name: 1
                            },
                            page: parseInt(page ? page : "1", 10),
                            limit: parseInt(pageSize ? pageSize : "20", 10)
                        };
                        return [4 /*yield*/, this.getCompanies({
                                deleted: false,
                                team: team
                            }, options, search)];
                    case 1:
                        companies = _b.sent();
                        /* istanbul ignore if  */
                        if (options.page && companies.pages && companies.pages < options.page) {
                            res.status(400).json({
                                error: 'La página solicitada no existe.',
                                status: 200
                            });
                        }
                        else {
                            res.json({
                                count: companies.total,
                                pages: companies.pages,
                                hasPrevious: options.page && options.page > 1 && companies.pages && companies.pages >= options.page,
                                hasNext: options.page && companies.pages && companies.pages > options.page,
                                results: companies.docs,
                                status: 200
                            });
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    AdminCompaniesController.prototype.apiCreateCompany = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, name, businessName, rut, billing, notifications, team, image, marker, existCompany, newCompany, e_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!req.user.hasPermission('addCompany')) {
                            return [2 /*return*/, res.status(403).json({
                                    message: 'No tienes permisos para esta operación'
                                })];
                        }
                        _a = req.body, name = _a.name, businessName = _a.businessName, rut = _a.rut, billing = _a.billing, notifications = _a.notifications;
                        team = req.user.team;
                        image = general_utils_1["default"].getFileFromRequest(req.files, 'image');
                        marker = general_utils_1["default"].getFileFromRequest(req.files, 'marker');
                        if (!name || !name.trim().length) {
                            res.status(400).json({
                                message: 'El nombre es requerido.',
                                status: 400
                            });
                        }
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 10, , 11]);
                        return [4 /*yield*/, company_model_1["default"].find({
                                name: name,
                                businessName: businessName,
                                rut: rut,
                                team: team,
                                deleted: false
                            })];
                    case 2:
                        existCompany = _b.sent();
                        if (!existCompany.length) return [3 /*break*/, 3];
                        res.status(400).json({
                            message: 'Empresa ya existe.',
                            status: 400
                        });
                        return [3 /*break*/, 9];
                    case 3:
                        newCompany = new company_model_1["default"]({
                            name: name,
                            billing: JSON.parse(billing),
                            notifications: JSON.parse(notifications),
                            team: team
                        });
                        if (!image) return [3 /*break*/, 5];
                        image.headers = {
                            'Content-Type': image.mimetype
                        };
                        image.team = team._id;
                        return [4 /*yield*/, newCompany.attach('image', image)];
                    case 4:
                        _b.sent();
                        _b.label = 5;
                    case 5:
                        if (!marker) return [3 /*break*/, 7];
                        marker.headers = {
                            'Content-Type': marker.mimetype
                        };
                        marker.team = team._id;
                        return [4 /*yield*/, newCompany.attach('marker', marker)];
                    case 6:
                        _b.sent();
                        _b.label = 7;
                    case 7: return [4 /*yield*/, newCompany.save()];
                    case 8:
                        _b.sent();
                        res.status(201).json({
                            message: 'Empresa creada satisfactoriamente.',
                            company: newCompany
                        });
                        _b.label = 9;
                    case 9: return [3 /*break*/, 11];
                    case 10:
                        e_1 = _b.sent();
                        /* istanbul ignore next  */
                        console.log(e_1);
                        /* istanbul ignore next  */
                        res.status(500).json(e_1);
                        return [3 /*break*/, 11];
                    case 11: return [2 /*return*/];
                }
            });
        });
    };
    AdminCompaniesController.prototype.apiUpdateCompany = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var id, team, _a, name, businessName, rut, billing, notifications, image, marker, company, response, response, e_2;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!req.user.hasPermission('changeCompany')) {
                            return [2 /*return*/, res.status(403).json({
                                    message: 'No tienes permisos para esta operación'
                                })];
                        }
                        id = req.params.id;
                        team = req.user.team;
                        _a = req.body, name = _a.name, businessName = _a.businessName, rut = _a.rut, billing = _a.billing, notifications = _a.notifications;
                        image = general_utils_1["default"].getFileFromRequest(req.files, 'image');
                        marker = general_utils_1["default"].getFileFromRequest(req.files, 'marker');
                        if (!name || !name.length) {
                            res.status(400).json({
                                message: 'The name is are required',
                                status: 400
                            });
                        }
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 12, , 13]);
                        return [4 /*yield*/, company_model_1["default"].findOne({
                                _id: id,
                                team: team
                            })];
                    case 2:
                        company = _b.sent();
                        if (!company) return [3 /*break*/, 10];
                        company.businessName = businessName;
                        company.rut = rut;
                        company.name = name;
                        company.billing = JSON.parse(billing);
                        company.notifications = JSON.parse(notifications);
                        if (!image) return [3 /*break*/, 5];
                        image.headers = {
                            'Content-Type': image.mimetype
                        };
                        image.team = team._id;
                        return [4 /*yield*/, company.attach('image', image)];
                    case 3:
                        _b.sent();
                        return [4 /*yield*/, company.update({ image: company.image })];
                    case 4:
                        _b.sent();
                        _b.label = 5;
                    case 5:
                        if (!marker) return [3 /*break*/, 8];
                        marker.headers = {
                            'Content-Type': marker.mimetype
                        };
                        marker.team = team._id;
                        return [4 /*yield*/, company.attach('marker', marker)];
                    case 6:
                        _b.sent();
                        return [4 /*yield*/, company.update({ marker: company.marker })];
                    case 7:
                        _b.sent();
                        _b.label = 8;
                    case 8: return [4 /*yield*/, company.save()];
                    case 9:
                        _b.sent();
                        response = {
                            message: 'Empresa editada satisfactoriamente.',
                            company: company
                        };
                        res.status(200).json(response);
                        return [3 /*break*/, 11];
                    case 10:
                        response = {
                            id: id,
                            message: 'Empresa no encontrada'
                        };
                        res.status(400).json(response);
                        _b.label = 11;
                    case 11: return [3 /*break*/, 13];
                    case 12:
                        e_2 = _b.sent();
                        /* istanbul ignore next  */
                        console.log(e_2);
                        /* istanbul ignore next  */
                        res.status(500).json(e_2);
                        return [3 /*break*/, 13];
                    case 13: return [2 /*return*/];
                }
            });
        });
    };
    AdminCompaniesController.prototype.apiDeleteCompany = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var id, team, company, response, response, e_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!req.user.hasPermission('deleteCompany')) {
                            return [2 /*return*/, res.status(403).json({
                                    message: 'No tienes permisos para esta operación'
                                })];
                        }
                        id = req.params.id;
                        team = req.user.team._id;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, company_model_1["default"].findOneAndUpdate({
                                _id: id,
                                team: team
                            }, {
                                deleted: true
                            }, {
                                "new": true
                            })];
                    case 2:
                        company = _a.sent();
                        if (company) {
                            response = {
                                message: 'Empresa eliminada satisfactoriamente.',
                                company: company
                            };
                            res.status(200).json(response);
                        }
                        else {
                            response = {
                                id: id,
                                message: 'Empresa no encontrada'
                            };
                            res.status(200).json(response);
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        e_3 = _a.sent();
                        /* istanbul ignore next  */
                        res.status(500).json(e_3);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    AdminCompaniesController.prototype.getCompanies = function (filter, options, search) {
        return new Promise(function (resolve, reject) {
            company_model_1["default"].paginate(filter, options, function (err, result) {
                /* istanbul ignore next  */
                if (err) {
                    return reject(err);
                }
                return resolve(result);
            });
        });
    };
    return AdminCompaniesController;
}());
exports["default"] = new AdminCompaniesController();
//# sourceMappingURL=company.admin.controller.js.map