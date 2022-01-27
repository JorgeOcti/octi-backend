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
var bluebird = require("bluebird");
var dotenv = require("dotenv");
var mongoose = require("mongoose");
var path = require("path");
var team_model_1 = require("../../app/models/team.model");
var requestItem_model_1 = require("../../request/models/requestItem.model");
var request_model_1 = require("../../request/models/request.model");
function migrateSalfa() {
    return __awaiter(this, void 0, void 0, function () {
        var MONGODB_URI, team, requestItems, _i, requestItems_1, requestItem, answerByKey, e_1, e_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    dotenv.config({
                        path: path.join(__dirname, '../../../.env')
                    });
                    MONGODB_URI = process.env.MONGODB_URI || '';
                    mongoose.Promise = bluebird;
                    return [4 /*yield*/, mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })];
                case 1:
                    _a.sent();
                    mongoose.set('debug', true);
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 11, , 12]);
                    return [4 /*yield*/, team_model_1["default"].findById('5bf2de35caf8ef7096105cdd')];
                case 3:
                    team = _a.sent();
                    return [4 /*yield*/, requestItem_model_1["default"].find({ team: team })];
                case 4:
                    requestItems = _a.sent();
                    _i = 0, requestItems_1 = requestItems;
                    _a.label = 5;
                case 5:
                    if (!(_i < requestItems_1.length)) return [3 /*break*/, 10];
                    requestItem = requestItems_1[_i];
                    _a.label = 6;
                case 6:
                    _a.trys.push([6, 8, , 9]);
                    answerByKey = requestItem.answers.reduce(function (acc, cur) {
                        var _a;
                        return __assign(__assign({}, acc), (_a = {}, _a[cur.questionId.toString()] = cur, _a));
                    }, {});
                    return [4 /*yield*/, request_model_1["default"].findByIdAndUpdate(requestItem.request, {
                            customerInformation: {
                                name: answerByKey.hasOwnProperty('5bf2de35caf8ef7096105c21') ? answerByKey['5bf2de35caf8ef7096105c21'].answer : '',
                                rut: answerByKey.hasOwnProperty('5bf2de35caf8ef7096105c22') ? answerByKey['5bf2de35caf8ef7096105c22'].answer : '',
                                email: answerByKey.hasOwnProperty('60b9232164adc90013a79b45') ? answerByKey['60b9232164adc90013a79b45'].answer : '',
                                phone: ''
                            },
                            advancePaymentInformation: {
                                method: answerByKey.hasOwnProperty('5bf2de35caf8ef7096105c23') ? answerByKey['5bf2de35caf8ef7096105c23'].answer : '',
                                number: '',
                                files: []
                            }
                        })];
                case 7:
                    _a.sent();
                    return [3 /*break*/, 9];
                case 8:
                    e_1 = _a.sent();
                    console.log(JSON.stringify(requestItem));
                    console.log('Ha ocurrido un error en migrateSalfa');
                    console.log('error:', e_1);
                    return [3 /*break*/, 9];
                case 9:
                    _i++;
                    return [3 /*break*/, 5];
                case 10: return [3 /*break*/, 12];
                case 11:
                    e_2 = _a.sent();
                    console.log('Ha ocurrido un error en migrateSalfa');
                    console.log('error:', e_2);
                    return [3 /*break*/, 12];
                case 12:
                    process.exit(1);
                    return [2 /*return*/];
            }
        });
    });
}
migrateSalfa();
//# sourceMappingURL=migrateSalfa.js.map