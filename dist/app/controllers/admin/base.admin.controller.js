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
var Raven = require("raven");
var server_1 = require("../../../server");
var BaseAdminController = /** @class */ (function () {
    function BaseAdminController(instanceModel) {
        this.instanceModel = instanceModel;
        this.apiList = this.apiList.bind(this);
        this.apiCreate = this.apiCreate.bind(this);
        this.apiUpdate = this.apiUpdate.bind(this);
        this.apiDelete = this.apiDelete.bind(this);
        this.getDataPaginated = this.getDataPaginated.bind(this);
    }
    BaseAdminController.prototype.index = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, _b, _c;
            var _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        if (req.context.permissionRequired && !req.user.hasPermission(req.context.permissionRequired)) {
                            res.status(403).render('403');
                        }
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
    BaseAdminController.prototype.apiCreate = function (req, res) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var existInstance, result, e_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (req.context.permissionRequired && !req.user.hasPermission(req.context.permissionRequired)) {
                            return [2 /*return*/, res.status(403).json({
                                    message: 'No tienes permisos para esta operación'
                                })];
                        }
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 6, , 7]);
                        return [4 /*yield*/, this.instanceModel.find(req.context.filter)];
                    case 2:
                        existInstance = _b.sent();
                        if (!existInstance.length) return [3 /*break*/, 3];
                        res.status(400).json({
                            message: req.context.name + " ya existe.",
                            status: 400
                        });
                        return [3 /*break*/, 5];
                    case 3:
                        result = new this.instanceModel(req.context.data);
                        return [4 /*yield*/, result.save()];
                    case 4:
                        _b.sent();
                        if ((_a = req.context) === null || _a === void 0 ? void 0 : _a.socketName) {
                            server_1.io.to(req.context.socketName).emit('REFRESH', {
                                update: true,
                                updatedBy: req.user._id
                            });
                        }
                        res.status(201).json({
                            message: req.context.name + " creado/a satisfactoriamente.",
                            result: result
                        });
                        _b.label = 5;
                    case 5: return [3 /*break*/, 7];
                    case 6:
                        e_1 = _b.sent();
                        /* istanbul ignore next  */
                        Raven.captureException(e_1);
                        res.status(500).json(e_1);
                        return [3 /*break*/, 7];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    BaseAdminController.prototype.apiUpdate = function (req, res) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var id, result, e_2;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (req.context.permissionRequired && !req.user.hasPermission(req.context.permissionRequired)) {
                            return [2 /*return*/, res.status(403).json({
                                    message: 'No tienes permisos para esta operación'
                                })];
                        }
                        id = req.params.id;
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.instanceModel
                                .findOneAndUpdate(req.context.filter, req.context.data, {
                                "new": true
                            })];
                    case 2:
                        result = _b.sent();
                        if (result) {
                            if ((_a = req.context) === null || _a === void 0 ? void 0 : _a.socketName) {
                                server_1.io.to(req.context.socketName).emit('REFRESH', {
                                    update: true,
                                    updatedBy: req.user._id
                                });
                            }
                            res.status(200).json({
                                message: req.context.name + " editado/a satisfactoriamente.",
                                result: result
                            });
                        }
                        else {
                            res.status(400).json({
                                id: id,
                                message: req.context.name + " no encontrado/a."
                            });
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        e_2 = _b.sent();
                        /* istanbul ignore next  */
                        Raven.captureException(e_2);
                        res.status(500).json(e_2);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    BaseAdminController.prototype.apiDelete = function (req, res) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var id, existInstance, e_3;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (req.context.permissionRequired && !req.user.hasPermission(req.context.permissionRequired)) {
                            return [2 /*return*/, res.status(403).json({
                                    message: 'No tienes permisos para esta operación'
                                })];
                        }
                        id = req.params.id;
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 6, , 7]);
                        return [4 /*yield*/, this.instanceModel.findOne(req.context.filter)];
                    case 2:
                        existInstance = _b.sent();
                        if (!!existInstance) return [3 /*break*/, 3];
                        res.status(400).json({
                            message: req.context.name + " no encontrado/a.",
                            status: 400
                        });
                        return [3 /*break*/, 5];
                    case 3: return [4 /*yield*/, existInstance.remove()];
                    case 4:
                        _b.sent();
                        if ((_a = req.context) === null || _a === void 0 ? void 0 : _a.socketName) {
                            server_1.io.to(req.context.socketName).emit('REFRESH', {
                                update: true,
                                updatedBy: req.user._id
                            });
                        }
                        res.status(200).json({
                            id: id,
                            message: req.context.name + " eliminado/a satisfactoriamente."
                        });
                        _b.label = 5;
                    case 5: return [3 /*break*/, 7];
                    case 6:
                        e_3 = _b.sent();
                        /* istanbul ignore next  */
                        Raven.captureException(e_3);
                        res.status(500).json(e_3);
                        return [3 /*break*/, 7];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    BaseAdminController.prototype.apiList = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, page, pageSize, data, e_4;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (req.context.permissionRequired && !req.user.hasPermission(req.context.permissionRequired)) {
                            return [2 /*return*/, res.status(403).json({
                                    message: 'No tienes permisos para esta operación'
                                })];
                        }
                        _a = req.query, page = _a.page, pageSize = _a.pageSize;
                        // paginate options
                        this.paginateOptions = __assign(__assign({}, this.paginateOptions), { page: parseInt(page ? page : '1', 10), limit: parseInt(pageSize ? pageSize : '20', 10) });
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.getDataPaginated({
                                filter: req.context.filter
                            })];
                    case 2:
                        data = _b.sent();
                        // validate exist page
                        /* istanbul ignore if  */
                        if (this.paginateOptions.page && data.pages && data.pages < this.paginateOptions.page) {
                            res.status(404).json({
                                message: 'La página solicitada no existe.',
                                status: 404
                            });
                        }
                        else {
                            res.json({
                                count: data.total,
                                pages: data.pages,
                                hasPrevious: this.paginateOptions.page && this.paginateOptions.page > 1 && data.pages && data.pages >= this.paginateOptions.page,
                                hasNext: this.paginateOptions.page && data.pages && data.pages > this.paginateOptions.page,
                                results: data.docs,
                                status: 200
                            });
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        e_4 = _b.sent();
                        /* istanbul ignore next  */
                        Raven.captureException(e_4);
                        res.status(500).json(e_4);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    BaseAdminController.prototype.getDataPaginated = function (_a) {
        var _this = this;
        var filter = _a.filter;
        return new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
            var _a, e_5;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        _a = resolve;
                        return [4 /*yield*/, this.instanceModel.paginate(filter, this.paginateOptions)];
                    case 1:
                        _a.apply(void 0, [_b.sent()]);
                        return [3 /*break*/, 3];
                    case 2:
                        e_5 = _b.sent();
                        /* istanbul ignore next  */
                        reject(e_5);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); });
    };
    return BaseAdminController;
}());
exports["default"] = BaseAdminController;
//# sourceMappingURL=base.admin.controller.js.map