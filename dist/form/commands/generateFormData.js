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
var moment = require("moment");
var mongoose = require("mongoose");
var path = require("path");
var random = require("random");
var car_model_1 = require("../../app/models/car.model");
var company_model_1 = require("../../app/models/company.model");
var team_model_1 = require("../../app/models/team.model");
var user_model_1 = require("../../app/models/user.model");
var venue_model_1 = require("../../app/models/venue.model");
var damages_model_1 = require("../models/damages.model");
var form_model_1 = require("../models/form.model");
var participant_model_1 = require("../models/participant.model");
function pickRandom(ary) {
    var index = Math.floor(random.float() * ary.length);
    return ary[index];
}
function generateRandomDamages(damage) {
    var p = random.float() * random.float() * random.float();
    var count = damage.parts.length;
    var partsTotal = Math.floor(p * count);
    var damages = [];
    for (var i = 0; i < partsTotal; i++) {
        var part = pickRandom(damage.parts);
        var kind = pickRandom(damage.kinds);
        var position = pickRandom(damage.positions);
        var newDamage = {
            part: part,
            kind: kind,
            position: position
        };
        damages.push(newDamage);
    }
    return damages;
}
function generateFormData() {
    return __awaiter(this, void 0, void 0, function () {
        var MONGODB_URI, team, company, user, distributor, receivers, reception, damage, cars, damaged, total, _loop_1, _i, cars_1, car;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    dotenv.config({
                        path: path.join(__dirname, '../../../.env')
                    });
                    MONGODB_URI = process.env.MONGODB_URI || '';
                    mongoose.Promise = bluebird;
                    return [4 /*yield*/, mongoose.connect(MONGODB_URI, { useMongoClient: true })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, team_model_1["default"].findOne({ name: 'Derco' })];
                case 2:
                    team = _a.sent();
                    return [4 /*yield*/, company_model_1["default"].findOne({ name: 'Derco' })];
                case 3:
                    company = _a.sent();
                    return [4 /*yield*/, user_model_1["default"].findOne({ email: 'richard@osacontrol.com' })];
                case 4:
                    user = _a.sent();
                    return [4 /*yield*/, venue_model_1["default"].findById('5c3605307eb40314d3c46e75')];
                case 5:
                    distributor = _a.sent();
                    return [4 /*yield*/, venue_model_1["default"].find({ team: team, type: 'receiver' })];
                case 6:
                    receivers = _a.sent();
                    return [4 /*yield*/, form_model_1["default"].findOne({ name: 'RECEPCIÓN' })];
                case 7:
                    reception = _a.sent();
                    return [4 /*yield*/, damages_model_1["default"].findById('5cbdda142848880028c548d6')];
                case 8:
                    damage = _a.sent();
                    console.log('team', team);
                    console.log('dist', distributor);
                    console.log('rcv', receivers);
                    return [4 /*yield*/, car_model_1["default"].find({ team: team })];
                case 9:
                    cars = _a.sent();
                    console.log('car0', cars[0]);
                    damaged = 0;
                    total = 0;
                    _loop_1 = function (car) {
                        var receiver, isDamaged, totalMinutes, minutes, t0, damages, sections, participant, isDamaged2, maximum, t1, damages2, sections2, participant2;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    receiver = pickRandom(receivers);
                                    isDamaged = random.float() > 0.7;
                                    totalMinutes = 6 * 30 * 24 * 60;
                                    minutes = random.float(0, totalMinutes);
                                    t0 = moment().subtract(minutes, 'minutes');
                                    if (isDamaged) {
                                        damaged += 1;
                                    }
                                    total += 1;
                                    damages = generateRandomDamages(damage);
                                    sections = reception.sections.map(function (section) {
                                        return {
                                            _id: section._id,
                                            name: section.name,
                                            shortName: section.shortName,
                                            answers: section.questions.map(function (question) {
                                                if (question.kind === 'damage') {
                                                    return {
                                                        question: question.question,
                                                        kind: question.kind,
                                                        order: question.order,
                                                        weight: question.weight,
                                                        damagesSelected: damages
                                                    };
                                                }
                                                else {
                                                    return {
                                                        question: question.question,
                                                        kind: question.kind,
                                                        order: question.order,
                                                        weight: question.weight
                                                    };
                                                }
                                            }),
                                            qualification: 0,
                                            weight: section.weight,
                                            order: section.order
                                        };
                                    });
                                    participant = new participant_model_1["default"]({
                                        team: team,
                                        company: company,
                                        user: user,
                                        car: car,
                                        sections: sections,
                                        name: 'RECEPCION',
                                        venue: distributor._id,
                                        sendTo: receiver,
                                        damagesSelected: damages
                                    });
                                    return [4 /*yield*/, participant.save()];
                                case 1:
                                    _b.sent();
                                    participant.createdAt = t0.toDate();
                                    return [4 /*yield*/, participant.save()];
                                case 2:
                                    _b.sent();
                                    isDamaged2 = random.float() > 0.7;
                                    maximum = random.float(0, 60 * 24 * 20);
                                    t1 = moment(t0).add(maximum, 'minutes');
                                    if (isDamaged2) {
                                        damaged += 1;
                                    }
                                    total += 1;
                                    damages2 = generateRandomDamages(damage);
                                    sections2 = reception.sections.map(function (section) {
                                        return {
                                            _id: section._id,
                                            name: section.name,
                                            shortName: section.shortName,
                                            answers: section.questions.map(function (question) {
                                                if (question.kind === 'damage') {
                                                    return {
                                                        question: question.question,
                                                        kind: question.kind,
                                                        order: question.order,
                                                        weight: question.weight,
                                                        damagesSelected: damages2
                                                    };
                                                }
                                                else {
                                                    return {
                                                        question: question.question,
                                                        kind: question.kind,
                                                        order: question.order,
                                                        weight: question.weight
                                                    };
                                                }
                                            }),
                                            qualification: 0,
                                            weight: section.weight,
                                            order: section.order
                                        };
                                    });
                                    console.log('--receiver', receiver);
                                    participant2 = new participant_model_1["default"]({
                                        team: team,
                                        company: company,
                                        user: user,
                                        car: car,
                                        receiveFrom: distributor._id,
                                        sections: sections2,
                                        name: 'RECEPCION 2',
                                        venue: receiver._id,
                                        damagesSelected: damages2
                                    });
                                    return [4 /*yield*/, participant2.save()];
                                case 3:
                                    _b.sent();
                                    participant2.createdAt = t1.toDate();
                                    return [4 /*yield*/, participant2.save()];
                                case 4:
                                    _b.sent();
                                    return [2 /*return*/];
                            }
                        });
                    };
                    _i = 0, cars_1 = cars;
                    _a.label = 10;
                case 10:
                    if (!(_i < cars_1.length)) return [3 /*break*/, 13];
                    car = cars_1[_i];
                    return [5 /*yield**/, _loop_1(car)];
                case 11:
                    _a.sent();
                    _a.label = 12;
                case 12:
                    _i++;
                    return [3 /*break*/, 10];
                case 13:
                    console.log('damaged', damaged, 'total', total);
                    process.exit(1);
                    return [2 /*return*/];
            }
        });
    });
}
generateFormData();
//# sourceMappingURL=generateFormData.js.map