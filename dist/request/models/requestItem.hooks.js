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
var request_model_1 = require("./request.model");
var requestItem_model_1 = require("./requestItem.model");
var models_1 = require("../../app/models");
var requestItemStatus_model_1 = require("./requestItemStatus.model");
var requestIteam_meta_1 = require("./requestIteam.meta");
var RequestItemHooks = /** @class */ (function () {
    function RequestItemHooks() {
        this.postFindOneAndUpdateHandler = this.postFindOneAndUpdateHandler.bind(this);
    }
    RequestItemHooks.prototype.postFindOneAndUpdateHandler = function (doc) {
        return __awaiter(this, void 0, void 0, function () {
            var request, _a, car, user, origin, destination, status, meta;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, request_model_1["default"].findById(doc.request, { meta: false })];
                    case 1:
                        request = _b.sent();
                        if (!request) return [3 /*break*/, 5];
                        return [4 /*yield*/, Promise.all([
                                models_1.Car.findById(doc.car),
                                models_1.User.findById(doc.createdBy),
                                models_1.Venue.findById(doc.origin),
                                models_1.Venue.findById(doc.destination),
                                requestItemStatus_model_1["default"].findById(doc.status)
                            ])];
                    case 2:
                        _a = _b.sent(), car = _a[0], user = _a[1], origin = _a[2], destination = _a[3], status = _a[4];
                        return [4 /*yield*/, requestItem_model_1["default"].updateOne({ _id: doc._id }, { $unset: { meta: {} } })];
                    case 3:
                        _b.sent();
                        meta = requestIteam_meta_1["default"].processMeta({
                            request: request,
                            car: car,
                            user: user,
                            origin: origin,
                            destination: destination,
                            status: status
                        });
                        console.log(meta);
                        return [4 /*yield*/, requestItem_model_1["default"].updateMany({ request: request }, {
                                $set: { meta: meta }
                            })];
                    case 4:
                        _b.sent();
                        _b.label = 5;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    return RequestItemHooks;
}());
var requestItemsHooks = new RequestItemHooks();
exports["default"] = requestItemsHooks;
//# sourceMappingURL=requestItem.hooks.js.map