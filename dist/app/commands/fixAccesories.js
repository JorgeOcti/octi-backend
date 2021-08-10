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
var form_model_1 = require("../../form/models/form.model");
var participant_model_1 = require("../../form/models/participant.model");
function fixAccesories() {
    return __awaiter(this, void 0, void 0, function () {
        var MONGODB_URI, forms, _i, forms_1, form, _a, _b, section, _c, _d, question, _e, _f, item, participants, _g, participants_1, participant, _h, _j, section, _k, _l, answer, _m, _o, item, _p, _q, accesorySelected;
        return __generator(this, function (_r) {
            switch (_r.label) {
                case 0:
                    dotenv.config({
                        path: path.join(__dirname, '../../../.env')
                    });
                    MONGODB_URI = process.env.MONGODB_URI || '';
                    mongoose.Promise = bluebird;
                    return [4 /*yield*/, mongoose.connect(MONGODB_URI, { useMongoClient: true })];
                case 1:
                    _r.sent();
                    mongoose.set('debug', true);
                    return [4 /*yield*/, form_model_1["default"].find({})];
                case 2:
                    forms = _r.sent();
                    _i = 0, forms_1 = forms;
                    _r.label = 3;
                case 3:
                    if (!(_i < forms_1.length)) return [3 /*break*/, 6];
                    form = forms_1[_i];
                    for (_a = 0, _b = form.sections; _a < _b.length; _a++) {
                        section = _b[_a];
                        for (_c = 0, _d = section.questions; _c < _d.length; _c++) {
                            question = _d[_c];
                            if (question.accessories) {
                                for (_e = 0, _f = question.accessories.items; _e < _f.length; _e++) {
                                    item = _f[_e];
                                    if (!item.amount) {
                                        item.amount = false;
                                    }
                                }
                            }
                        }
                    }
                    return [4 /*yield*/, form.save()];
                case 4:
                    _r.sent();
                    _r.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 3];
                case 6: return [4 /*yield*/, participant_model_1["default"].find({}, {
                        'sections.answers.accessories': true,
                        'sections.answers.accesoriesAnswered': true,
                        'sections.answers.accesoriesSelected': true
                    })];
                case 7:
                    participants = _r.sent();
                    _g = 0, participants_1 = participants;
                    _r.label = 8;
                case 8:
                    if (!(_g < participants_1.length)) return [3 /*break*/, 11];
                    participant = participants_1[_g];
                    for (_h = 0, _j = participant.sections; _h < _j.length; _h++) {
                        section = _j[_h];
                        for (_k = 0, _l = section.answers; _k < _l.length; _k++) {
                            answer = _l[_k];
                            if (answer.accessories) {
                                for (_m = 0, _o = answer.accessories.items; _m < _o.length; _m++) {
                                    item = _o[_m];
                                    item.amount = false;
                                }
                            }
                            if (answer.accesoriesSelected && answer.accesoriesSelected.length) {
                                for (_p = 0, _q = answer.accesoriesSelected; _p < _q.length; _p++) {
                                    accesorySelected = _q[_p];
                                    if (!answer.accesoriesAnswered.length) {
                                        answer.accesoriesAnswered.push({
                                            item: accesorySelected,
                                            amount: 1
                                        });
                                    }
                                }
                            }
                        }
                    }
                    return [4 /*yield*/, participant.save()];
                case 9:
                    _r.sent();
                    _r.label = 10;
                case 10:
                    _g++;
                    return [3 /*break*/, 8];
                case 11:
                    process.exit(1);
                    return [2 /*return*/];
            }
        });
    });
}
fixAccesories();
//# sourceMappingURL=fixAccesories.js.map