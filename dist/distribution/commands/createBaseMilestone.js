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
var bluebird = require("bluebird");
var dotenv = require("dotenv");
var mongoose = require("mongoose");
var path = require("path");
var milestone_model_1 = require("../models/milestone.model");
var team_model_1 = require("../../app/models/team.model");
var form_model_1 = require("../../form/models/form.model");
// import ActivityHistory, { ChoicesTypeActivity } from '../models/activityHistory.model';
function createBaseMilestone() {
    return __awaiter(this, void 0, void 0, function () {
        var MONGODB_URI, teams, _i, teams_1, team, milestones, receptionForm, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 9, , 10]);
                    dotenv.config({
                        path: path.join(__dirname, '../../../.env')
                    });
                    MONGODB_URI = process.env.MONGODB_URI || '';
                    mongoose.Promise = bluebird;
                    return [4 /*yield*/, mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })];
                case 1:
                    _a.sent();
                    mongoose.set('debug', true);
                    return [4 /*yield*/, team_model_1["default"].find({})];
                case 2:
                    teams = _a.sent();
                    _i = 0, teams_1 = teams;
                    _a.label = 3;
                case 3:
                    if (!(_i < teams_1.length)) return [3 /*break*/, 8];
                    team = teams_1[_i];
                    return [4 /*yield*/, milestone_model_1["default"].find({ team: team._id })];
                case 4:
                    milestones = _a.sent();
                    return [4 /*yield*/, form_model_1["default"].findOne({ team: team._id, reception: true })];
                case 5:
                    receptionForm = _a.sent();
                    if (!(milestones.length === 0 && receptionForm)) return [3 /*break*/, 7];
                    return [4 /*yield*/, milestone_model_1["default"].insertMany([{
                                team: team._id,
                                name: 'Checkear carga',
                                kind: milestone_model_1.ChoicesKindMilestone.form,
                                form: receptionForm,
                                step: milestone_model_1.ChoicesStepMilestone.checkItem,
                                order: 1
                            }, {
                                team: team._id,
                                name: 'Evidencia de carga',
                                kind: milestone_model_1.ChoicesKindMilestone.file,
                                step: milestone_model_1.ChoicesStepMilestone.loadEvidence,
                                order: 2
                            }, {
                                team: team._id,
                                name: 'Subir Documentos',
                                kind: milestone_model_1.ChoicesKindMilestone.form,
                                form: receptionForm,
                                step: milestone_model_1.ChoicesStepMilestone.finishTransmittal,
                                order: 3
                            }])];
                case 6:
                    _a.sent();
                    _a.label = 7;
                case 7:
                    _i++;
                    return [3 /*break*/, 3];
                case 8: return [3 /*break*/, 10];
                case 9:
                    e_1 = _a.sent();
                    console.log(e_1);
                    process.exit(1);
                    return [3 /*break*/, 10];
                case 10:
                    process.exit(1);
                    return [2 /*return*/];
            }
        });
    });
}
createBaseMilestone();
//# sourceMappingURL=createBaseMilestone.js.map