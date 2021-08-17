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
var inventoryCar_model_1 = require("../models/inventoryCar.model");
var inventoryLabel_model_1 = require("../models/inventoryLabel.model");
function addlabel() {
    return __awaiter(this, void 0, void 0, function () {
        var MONGODB_URI, inventoryLabel, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
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
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    inventoryLabel = new inventoryLabel_model_1["default"]({
                        team: '5c06bd161f616ce4540bbb9e',
                        name: 'Pasar a encontrado',
                        affected: [inventoryCar_model_1.ChoicesStatusCarInventory.reported, inventoryCar_model_1.ChoicesStatusCarInventory.leftover],
                        sendTo: inventoryCar_model_1.ChoicesStatusCarInventory.found,
                        updatedBy: '5af487b4f6a4c95ccd991466'
                    });
                    inventoryLabel.validate(function (err) {
                        if (err) {
                            console.log(err);
                        }
                    });
                    return [4 /*yield*/, inventoryLabel.save()];
                case 3:
                    _a.sent();
                    return [3 /*break*/, 5];
                case 4:
                    e_1 = _a.sent();
                    console.log('e', e_1);
                    return [3 /*break*/, 5];
                case 5:
                    process.exit(1);
                    return [2 /*return*/];
            }
        });
    });
}
addlabel();
//# sourceMappingURL=addLabel.js.map