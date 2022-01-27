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
var company_model_1 = require("../models/company.model");
var team_model_1 = require("../models/team.model");
var user_model_1 = require("../models/user.model");
function addTeamToCompany() {
    return __awaiter(this, void 0, void 0, function () {
        var MONGODB_URI, companies, _i, companies_1, company, team, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    /*
                    * Generate teams and associate if necessary.
                    * - Create Team
                    * - Assing cars to team
                    * - Assing forms to team
                    * - Assing participant to team
                    * - Assing scalas to team
                    * - Assign users to team
                    * - Assign venes to team
                    * - Assing company to team
                    *
                    * fixed does not change field updatedAt in collections
                    * */
                    dotenv.config({
                        path: path.join(__dirname, '../../../.env')
                    });
                    MONGODB_URI = process.env.MONGODB_URI || '';
                    mongoose.Promise = bluebird;
                    return [4 /*yield*/, mongoose.connect(MONGODB_URI, {
                            useMongoClient: true
                        })];
                case 1:
                    _a.sent();
                    mongoose.set('debug', false);
                    return [4 /*yield*/, company_model_1["default"].find({ deleted: false })];
                case 2:
                    companies = _a.sent();
                    _a.label = 3;
                case 3:
                    _a.trys.push([3, 21, , 22]);
                    _i = 0, companies_1 = companies;
                    _a.label = 4;
                case 4:
                    if (!(_i < companies_1.length)) return [3 /*break*/, 20];
                    company = companies_1[_i];
                    console.log('Procesando -->', company.name);
                    return [4 /*yield*/, team_model_1["default"].findOne({
                            $or: [{
                                    name: company.name
                                }, {
                                    _id: company.team
                                }]
                        })];
                case 5:
                    team = _a.sent();
                    console.log('team', team);
                    if (!!team) return [3 /*break*/, 8];
                    return [4 /*yield*/, new team_model_1["default"]({
                            name: company.name
                        }).save()];
                case 6:
                    // create team
                    team = _a.sent();
                    // assign company
                    company.team = team;
                    return [4 /*yield*/, company.save()];
                case 7:
                    _a.sent();
                    _a.label = 8;
                case 8: 
                // assing teams
                // await Car.update({company}, {team}, {multi: true});
                return [4 /*yield*/, mongoose.connection.db.collection('cars').updateMany({ company: company._id }, { $set: { team: team._id } })];
                case 9:
                    // assing teams
                    // await Car.update({company}, {team}, {multi: true});
                    _a.sent();
                    // assing teams
                    // await Inventory.update({company}, {team}, {multi: true});
                    return [4 /*yield*/, mongoose.connection.db.collection('inventories').updateMany({ company: company._id }, { $set: { team: team._id } })];
                case 10:
                    // assing teams
                    // await Inventory.update({company}, {team}, {multi: true});
                    _a.sent();
                    // assing teams
                    // await Form.update({company}, {team}, {multi: true});
                    return [4 /*yield*/, mongoose.connection.db.collection('forms').updateMany({ company: company._id }, { $set: { team: team._id } })];
                case 11:
                    // assing teams
                    // await Form.update({company}, {team}, {multi: true});
                    _a.sent();
                    // assing participants
                    // await Participant.update({company}, {team}, {multi: true});
                    return [4 /*yield*/, mongoose.connection.db.collection('participants').updateMany({ company: company._id }, { $set: { team: team._id } })];
                case 12:
                    // assing participants
                    // await Participant.update({company}, {team}, {multi: true});
                    _a.sent();
                    // assing teams
                    // await Scale.update({company}, {team}, {multi: true});
                    return [4 /*yield*/, mongoose.connection.db.collection('scales').updateMany({ company: company._id }, { $set: { team: team._id } })];
                case 13:
                    // assing teams
                    // await Scale.update({company}, {team}, {multi: true});
                    _a.sent();
                    // assign Venues
                    // await User.update({company}, {team}, {multi: true});
                    return [4 /*yield*/, mongoose.connection.db.collection('users').updateMany({ company: company._id }, { $set: { team: team._id } })];
                case 14:
                    // assign Venues
                    // await User.update({company}, {team}, {multi: true});
                    _a.sent();
                    // assign Venues
                    // await Venue.update({company}, {team}, {multi: true});
                    return [4 /*yield*/, mongoose.connection.db.collection('venues').updateMany({ company: company._id }, { $set: { team: team._id } })];
                case 15:
                    // assign Venues
                    // await Venue.update({company}, {team}, {multi: true});
                    _a.sent();
                    // assign alerts
                    // await Alert.update({company}, {team}, {multi: true});
                    return [4 /*yield*/, mongoose.connection.db.collection('alerts').updateMany({ company: company._id }, { $set: { team: team._id } })];
                case 16:
                    // assign alerts
                    // await Alert.update({company}, {team}, {multi: true});
                    _a.sent();
                    // fix venues
                    return [4 /*yield*/, user_model_1["default"].update({ deleted: { $exists: false } }, { deleted: false }, { multi: true })];
                case 17:
                    // fix venues
                    _a.sent();
                    // fix companies
                    return [4 /*yield*/, company_model_1["default"].update({ deleted: { $exists: false } }, { deleted: false }, { multi: true })];
                case 18:
                    // fix companies
                    _a.sent();
                    _a.label = 19;
                case 19:
                    _i++;
                    return [3 /*break*/, 4];
                case 20: return [3 /*break*/, 22];
                case 21:
                    e_1 = _a.sent();
                    console.log('Ha ocurrido un error en addTeamToCompany');
                    console.log('error:', e_1);
                    return [3 /*break*/, 22];
                case 22:
                    process.exit(1);
                    return [2 /*return*/];
            }
        });
    });
}
addTeamToCompany();
//# sourceMappingURL=addTeamToCompany.js.map