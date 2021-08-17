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
var car_model_1 = require("../models/car.model");
var inventoryCar_model_1 = require("../../inventory/models/inventoryCar.model");
var requestItem_model_1 = require("../../request/models/requestItem.model");
var participant_model_1 = require("../../form/models/participant.model");
var stockCar_model_1 = require("../../inventory/models/stockCar.model");
var planning_model_1 = require("../../planning/models/planning.model");
var team_model_1 = require("../models/team.model");
// import ActivityHistory, { ChoicesTypeActivity } from '../models/activityHistory.model';
function fixDuplicatesCar() {
    return __awaiter(this, void 0, void 0, function () {
        var MONGODB_URI, teams, _i, teams_1, team, cars, _a, cars_1, car, carsByVIN, firstCar, _b, carsByVIN_1, carByVIN, e_1;
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
                    _i = 0, teams_1 = teams;
                    _c.label = 3;
                case 3:
                    if (!(_i < teams_1.length)) return [3 /*break*/, 18];
                    team = teams_1[_i];
                    return [4 /*yield*/, car_model_1["default"].aggregate([{
                                $match: {
                                    team: team._id
                                }
                            }, {
                                $group: {
                                    _id: "$vin",
                                    count: { $sum: 1 }
                                }
                            }, {
                                $match: {
                                    count: { $ne: 1 }
                                }
                            }])];
                case 4:
                    cars = _c.sent();
                    if (!cars) return [3 /*break*/, 17];
                    _a = 0, cars_1 = cars;
                    _c.label = 5;
                case 5:
                    if (!(_a < cars_1.length)) return [3 /*break*/, 17];
                    car = cars_1[_a];
                    if (!(car._id && car._id.length)) return [3 /*break*/, 16];
                    return [4 /*yield*/, car_model_1["default"].find({ vin: car._id, team: team._id }, { sort: '-created_at' })];
                case 6:
                    carsByVIN = _c.sent();
                    firstCar = undefined;
                    _b = 0, carsByVIN_1 = carsByVIN;
                    _c.label = 7;
                case 7:
                    if (!(_b < carsByVIN_1.length)) return [3 /*break*/, 16];
                    carByVIN = carsByVIN_1[_b];
                    console.log('carByVIN', carByVIN);
                    if (!(firstCar === undefined)) return [3 /*break*/, 8];
                    firstCar = carByVIN;
                    return [3 /*break*/, 15];
                case 8: return [4 /*yield*/, inventoryCar_model_1["default"].update({ car: carByVIN._id }, { $set: { car: firstCar._id } })];
                case 9:
                    _c.sent();
                    return [4 /*yield*/, requestItem_model_1["default"].update({ car: carByVIN._id }, { $set: { car: firstCar._id } })];
                case 10:
                    _c.sent();
                    return [4 /*yield*/, participant_model_1["default"].update({ car: carByVIN._id }, { $set: { car: firstCar._id } })];
                case 11:
                    _c.sent();
                    return [4 /*yield*/, stockCar_model_1["default"].update({ car: carByVIN._id }, { $set: { car: firstCar._id } })];
                case 12:
                    _c.sent();
                    return [4 /*yield*/, planning_model_1["default"].update({ car: carByVIN._id }, { $set: { car: firstCar._id } })];
                case 13:
                    _c.sent();
                    return [4 /*yield*/, car_model_1["default"].findByIdAndDelete(carByVIN._id)];
                case 14:
                    _c.sent();
                    _c.label = 15;
                case 15:
                    _b++;
                    return [3 /*break*/, 7];
                case 16:
                    _a++;
                    return [3 /*break*/, 5];
                case 17:
                    _i++;
                    return [3 /*break*/, 3];
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
fixDuplicatesCar();
//# sourceMappingURL=fixDuplicates.js.map