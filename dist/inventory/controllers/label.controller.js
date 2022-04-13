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
var server_1 = require("../../server");
var inventoryLabel_model_1 = require("../models/inventoryLabel.model");
var teamSetting_model_1 = require("../../app/models/teamSetting.model");
var LabelController = /** @class */ (function () {
    function LabelController() {
        this.index = this.index.bind(this);
        this.apiList = this.apiList.bind(this);
        this.apiUpdateLabel = this.apiUpdateLabel.bind(this);
    }
    LabelController.prototype.index = function (req, res) {
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
    LabelController.prototype.apiList = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var team, _a, page, pageSize, options, labels, teamSettings, e_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        team = req.user.team._id;
                        _a = req.query, page = _a.page, pageSize = _a.pageSize;
                        options = {
                            sort: {
                                createdAt: -1
                            },
                            page: parseInt(page ? page : "1", 10),
                            limit: parseInt(pageSize ? pageSize : "20", 10)
                        };
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 6, , 7]);
                        return [4 /*yield*/, this.getLabels({
                                team: team
                            }, options)];
                    case 2:
                        labels = _b.sent();
                        if (!(options.page && labels.pages && labels.pages < options.page)) return [3 /*break*/, 3];
                        res.status(400).json({
                            message: 'La página solicitada no existe.',
                            status: 400
                        });
                        return [3 /*break*/, 5];
                    case 3: return [4 /*yield*/, teamSetting_model_1["default"].findOne({ team: team })];
                    case 4:
                        teamSettings = _b.sent();
                        res.json({
                            inventorySettings: teamSettings.inventory,
                            count: labels.total,
                            pages: labels.pages,
                            hasPrevious: options.page && options.page > 1 && labels.pages && labels.pages >= options.page,
                            hasNext: options.page && labels.pages && labels.pages > options.page,
                            results: labels.docs,
                            status: 200
                        });
                        _b.label = 5;
                    case 5: return [3 /*break*/, 7];
                    case 6:
                        e_1 = _b.sent();
                        /* istanbul ignore next  */
                        res.status(500).json(e_1);
                        return [3 /*break*/, 7];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    LabelController.prototype.apiCreateLabel = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var team, body, inventoryLabel, response, e_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        team = req.user.team._id;
                        body = req.body;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        inventoryLabel = new inventoryLabel_model_1["default"]({
                            name: body.name,
                            affected: body.affected,
                            sendTo: body.sendTo,
                            description: body.description,
                            isExhibition: body.isExhibition,
                            color: body.color,
                            requireCustomText: body.requireCustomText,
                            updatedBy: req.user._id,
                            team: team
                        });
                        return [4 /*yield*/, inventoryLabel.save()];
                    case 2:
                        _a.sent();
                        response = {
                            message: 'Etiqueta creada satisfactoriamente.',
                            label: inventoryLabel
                        };
                        server_1.io.to("label-list-" + team).emit('REFRESH', {
                            update: true,
                            updatedBy: req.user._id
                        });
                        res.status(200).json(response);
                        return [3 /*break*/, 4];
                    case 3:
                        e_2 = _a.sent();
                        /* istanbul ignore next  */
                        console.log(e_2);
                        /* istanbul ignore next  */
                        res.status(500).json(e_2);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    LabelController.prototype.apiUpdateLabel = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var id, team, body, inventoryLabel, response, response, e_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        id = req.params.id;
                        team = req.user.team._id;
                        body = req.body;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, inventoryLabel_model_1["default"].findOneAndUpdate({
                                _id: id,
                                team: team
                            }, {
                                name: body.name,
                                active: body.active,
                                affected: body.affected,
                                sendTo: body.sendTo,
                                description: body.description,
                                isExhibition: body.isExhibition,
                                color: body.color,
                                requireCustomText: body.requireCustomText,
                                updatedBy: req.user._id
                            }, {
                                "new": true
                            })];
                    case 2:
                        inventoryLabel = _a.sent();
                        if (inventoryLabel) {
                            response = {
                                message: 'Etiqueta editada satisfactoriamente.',
                                label: inventoryLabel
                            };
                            server_1.io.to("label-list-" + team).emit('REFRESH', {
                                update: true,
                                updatedBy: req.user._id
                            });
                            res.status(200).json(response);
                        }
                        else {
                            response = {
                                id: id,
                                message: 'Etiqueta no encontrada'
                            };
                            res.status(400).json(response);
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        e_3 = _a.sent();
                        /* istanbul ignore next  */
                        console.log(e_3);
                        /* istanbul ignore next  */
                        res.status(500).json(e_3);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    LabelController.prototype.apiDeleteLabel = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var id, team, inventoryLabel, response, response, e_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        id = req.params.id;
                        team = req.user.team._id;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, inventoryLabel_model_1["default"].findOneAndRemove({
                                _id: id,
                                team: team
                            })];
                    case 2:
                        inventoryLabel = _a.sent();
                        if (inventoryLabel) {
                            response = {
                                message: 'Etiqueta eliminada satisfactoriamente.',
                                id: inventoryLabel._id
                            };
                            server_1.io.to("label-list-" + team).emit('REFRESH', {
                                update: true,
                                updatedBy: req.user._id
                            });
                            res.status(200).json(response);
                        }
                        else {
                            response = {
                                id: id,
                                message: 'Esta Etiqueta ya fue eliminada.'
                            };
                            res.status(200).json(response);
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        e_4 = _a.sent();
                        /* istanbul ignore next */
                        res.status(500).json(e_4);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    LabelController.prototype.getLabels = function (filter, options) {
        return new Promise(function (resolve, reject) {
            inventoryLabel_model_1["default"].paginate(filter, options, function (err, result) {
                /* istanbul ignore next  */
                if (err) {
                    return reject(err);
                }
                return resolve(result);
            });
        });
    };
    return LabelController;
}());
exports["default"] = new LabelController();
//# sourceMappingURL=label.controller.js.map