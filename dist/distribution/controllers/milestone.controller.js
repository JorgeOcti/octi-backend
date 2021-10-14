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
var milestone_model_1 = require("../models/milestone.model");
var logger_service_1 = require("../../services/logger.service");
var MilestoneController = /** @class */ (function () {
    function MilestoneController() {
        this.index = this.index.bind(this);
        this.apiList = this.apiList.bind(this);
        // this.apiDetail = this.apiDetail.bind(this);
        // this.apiCreate = this.apiCreate.bind(this);
        // this.apiUpdate = this.apiUpdate.bind(this);
        // this.apiDelete = this.apiDelete.bind(this);
        this.getMilestone = this.getMilestone.bind(this);
    }
    MilestoneController.prototype.index = function (req, res) {
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
    MilestoneController.prototype.apiList = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var team, _a, page, pageSize, options, filter, milestones, e_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        team = req.user.team;
                        _a = req.query, page = _a.page, pageSize = _a.pageSize;
                        options = {
                            sort: {
                                'order': 1
                            },
                            page: parseInt(page ? page : '1', 10),
                            limit: parseInt(pageSize ? pageSize : '20', 10)
                        };
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 6, , 7]);
                        /* create default milestones */
                        return [4 /*yield*/, milestone_model_1["default"].findOneOrCreate({
                                step: milestone_model_1.ChoicesStepMilestone.checkItem,
                                team: team
                            }, {
                                name: 'Checkear carga',
                                team: team,
                                step: milestone_model_1.ChoicesStepMilestone.checkItem,
                                kind: milestone_model_1.ChoicesKindMilestone.form,
                                order: 1
                            })];
                    case 2:
                        /* create default milestones */
                        _b.sent();
                        return [4 /*yield*/, milestone_model_1["default"].findOneOrCreate({
                                step: milestone_model_1.ChoicesStepMilestone.loadEvidence,
                                team: team
                            }, {
                                name: 'Evidencia de carga',
                                team: team,
                                step: milestone_model_1.ChoicesStepMilestone.loadEvidence,
                                kind: milestone_model_1.ChoicesKindMilestone.file,
                                order: 2
                            })];
                    case 3:
                        _b.sent();
                        return [4 /*yield*/, milestone_model_1["default"].findOneOrCreate({
                                step: milestone_model_1.ChoicesStepMilestone.finishTransmittal,
                                team: team
                            }, {
                                name: 'Subir Documentos',
                                team: team,
                                step: milestone_model_1.ChoicesStepMilestone.finishTransmittal,
                                kind: milestone_model_1.ChoicesKindMilestone.form,
                                order: 3
                            })];
                    case 4:
                        _b.sent();
                        filter = {
                            team: team._id
                        };
                        return [4 /*yield*/, this.getMilestone(filter, options)];
                    case 5:
                        milestones = _b.sent();
                        /* istanbul ignore if  */
                        if (options.page && milestones.pages && milestones.pages < options.page) {
                            res.status(400).json({
                                message: 'La página solicitada no existe.',
                                status: 400
                            });
                        }
                        else {
                            res.json({
                                count: milestones.total,
                                pages: milestones.pages,
                                hasPrevious: options.page && options.page > 1 && milestones.pages && milestones.pages >= options.page,
                                hasNext: options.page && milestones.pages && milestones.pages > options.page,
                                results: milestones.docs,
                                status: 200
                            });
                        }
                        return [3 /*break*/, 7];
                    case 6:
                        e_1 = _b.sent();
                        /* istanbul ignore next */
                        logger_service_1["default"].error("TransmittalController.apiList: Async Error.");
                        /* istanbul ignore next */
                        logger_service_1["default"].error("{user: {_id: " + req.user._id + ", email: " + req.user.email + "}}");
                        res.status(500).json(e_1);
                        return [3 /*break*/, 7];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    MilestoneController.prototype.getMilestone = function (filter, options) {
        return new Promise(function (resolve, reject) {
            milestone_model_1["default"].paginate(filter, options, function (err, result) {
                if (err) {
                    return reject(err);
                }
                return resolve(result);
            });
        });
    };
    return MilestoneController;
}());
exports["default"] = new MilestoneController();
//# sourceMappingURL=milestone.controller.js.map