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
var transmittalItem_model_1 = require("../models/transmittalItem.model");
var requestItem_model_1 = require("../../request/models/requestItem.model");
var transmittal_model_1 = require("../models/transmittal.model");
var participant_model_1 = require("../../form/models/participant.model");
// import ActivityHistory, { ChoicesTypeActivity } from '../models/activityHistory.model';
function fixStatus() {
    return __awaiter(this, void 0, void 0, function () {
        var MONGODB_URI, teams, _i, teams_1, team, checkItem, transmittalItems, _a, transmittalItems_1, transmittalItem, finishTransmittal, transmittals, _b, transmittals_1, transmittal, e_1;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 19, , 20]);
                    dotenv.config({
                        path: path.join(__dirname, '../../../.env')
                    });
                    MONGODB_URI = process.env.MONGODB_URI || '';
                    mongoose.Promise = bluebird;
                    return [4 /*yield*/, mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })];
                case 1:
                    _c.sent();
                    mongoose.set('debug', true);
                    return [4 /*yield*/, team_model_1["default"].find({})];
                case 2:
                    teams = _c.sent();
                    if (!false) return [3 /*break*/, 4];
                    return [4 /*yield*/, participant_model_1["default"].find({ _id: null })];
                case 3:
                    _c.sent();
                    _c.label = 4;
                case 4:
                    _i = 0, teams_1 = teams;
                    _c.label = 5;
                case 5:
                    if (!(_i < teams_1.length)) return [3 /*break*/, 18];
                    team = teams_1[_i];
                    console.log(team.name);
                    return [4 /*yield*/, milestone_model_1["default"].findOne({
                            step: milestone_model_1.ChoicesStepMilestone.checkItem,
                            team: team
                        })];
                case 6:
                    checkItem = _c.sent();
                    if (!(checkItem && (checkItem === null || checkItem === void 0 ? void 0 : checkItem.requestItemStatus))) return [3 /*break*/, 11];
                    return [4 /*yield*/, transmittalItem_model_1["default"].find({
                            team: team,
                            revisions: { $exists: true, $not: { $size: 0 } }
                        })];
                case 7:
                    transmittalItems = _c.sent();
                    _a = 0, transmittalItems_1 = transmittalItems;
                    _c.label = 8;
                case 8:
                    if (!(_a < transmittalItems_1.length)) return [3 /*break*/, 11];
                    transmittalItem = transmittalItems_1[_a];
                    return [4 /*yield*/, requestItem_model_1["default"].findOneAndUpdate({ transmittalItem: transmittalItem }, { $set: { status: checkItem.requestItemStatus } })];
                case 9:
                    _c.sent();
                    _c.label = 10;
                case 10:
                    _a++;
                    return [3 /*break*/, 8];
                case 11: return [4 /*yield*/, milestone_model_1["default"].findOne({
                        step: milestone_model_1.ChoicesStepMilestone.finishTransmittal,
                        team: team
                    })];
                case 12:
                    finishTransmittal = _c.sent();
                    if (!(finishTransmittal && (finishTransmittal === null || finishTransmittal === void 0 ? void 0 : finishTransmittal.requestItemStatus))) return [3 /*break*/, 17];
                    return [4 /*yield*/, transmittal_model_1["default"].find({
                            team: team
                        }).populate([{
                                path: 'revision',
                                select: ['_id']
                            }])];
                case 13:
                    transmittals = _c.sent();
                    _b = 0, transmittals_1 = transmittals;
                    _c.label = 14;
                case 14:
                    if (!(_b < transmittals_1.length)) return [3 /*break*/, 17];
                    transmittal = transmittals_1[_b];
                    if (!transmittal.revision) return [3 /*break*/, 16];
                    return [4 /*yield*/, requestItem_model_1["default"].updateMany({ transmittal: transmittal }, { $set: { status: finishTransmittal.requestItemStatus } })];
                case 15:
                    _c.sent();
                    _c.label = 16;
                case 16:
                    _b++;
                    return [3 /*break*/, 14];
                case 17:
                    _i++;
                    return [3 /*break*/, 5];
                case 18: return [3 /*break*/, 20];
                case 19:
                    e_1 = _c.sent();
                    console.log(e_1);
                    process.exit(1);
                    return [3 /*break*/, 20];
                case 20:
                    process.exit(1);
                    return [2 /*return*/];
            }
        });
    });
}
fixStatus();
//# sourceMappingURL=FixStatus.js.map