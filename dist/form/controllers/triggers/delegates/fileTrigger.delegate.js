"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
var nullTrigger_delegate_1 = require("./nullTrigger.delegate");
var AWS = require("aws-sdk");
var s3Config = require("../../../../../s3-config.json");
var fs = require("fs");
var logger_service_1 = require("../../../../services/logger.service");
var moment = require("moment-timezone");
var HtmlPdf = require("html-pdf");
var participantFile_model_1 = require("../../../models/participantFile.model");
var path = require("path");
var general_utils_1 = require("../../../../utils/general.utils");
var FileTriggerDelegate = /** @class */ (function (_super) {
    __extends(FileTriggerDelegate, _super);
    function FileTriggerDelegate() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.pdfConfig = {
            format: 'Letter',
            orientation: 'portrait',
            border: {
                top: '0.3in',
                right: '0.5in',
                bottom: '0.3in',
                left: '0.5in'
            },
            type: 'pdf',
            quality: '75'
        };
        return _this;
    }
    FileTriggerDelegate.prototype.trigger = function (trigger, answers, payload) {
        return __awaiter(this, void 0, void 0, function () {
            var context_1, filename, participant_1, participantCompany, _a, css, templatePath, html, pdfPath, url, e_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 4, , 5]);
                        logger_service_1["default"].info("Kind Trigger: " + trigger.kind + " performing");
                        context_1 = this.processTrigerConfig(trigger, answers);
                        filename = moment().unix() + "_" + context_1.filename;
                        participant_1 = payload.participant;
                        participantCompany = participant_1.user.venue && participant_1.user.venue.company || {};
                        _a = context_1;
                        return [4 /*yield*/, participantFile_model_1["default"].find({ _id: { $in: context_1.signature } })];
                    case 1:
                        _a.signature = (_b.sent()).map(function (f) { return f.file.url; })[0];
                        moment.locale('es');
                        moment.tz.setDefault('America/Santiago');
                        css = fs.readFileSync(path.join(__dirname, '../../../../../views/') + 'form/carDetail/style.css', 'utf8');
                        templatePath = path.join(__dirname, '../../../../../views/') + context_1.template;
                        html = general_utils_1["default"].generateHtmlFromPugFile(templatePath, __assign(__assign(__assign(__assign({}, payload), answers), context_1), { css: css.replace(/(\r\n|\n|\r)/gm, ''), moment: moment, origin: function () {
                                if (participant_1.reception && participant_1.receiveFrom) {
                                    return participant_1.receiveFrom.name;
                                }
                                if (participant_1.shipping && participant_1.venue) {
                                    return participant_1.venue.name;
                                }
                                return false;
                            }, destination: function () {
                                if (participant_1.reception && participant_1.venue) {
                                    return participant_1.venue.name;
                                }
                                if (participant_1.shipping && participant_1.sendTo) {
                                    return participant_1.sendTo.name;
                                }
                                return false;
                            }, carrier: function () {
                                if (participant_1.carrier && participant_1.carrierBy) {
                                    return participant_1.carrierBy.name;
                                }
                                return false;
                            }, getAnswer: (function (scale, answer) {
                                if (answer && answer.hasOwnProperty('answer') && answer.answer) {
                                    var choice = scale.choices.find(function (choice) { return choice._id.toString() === answer.answer.toString(); });
                                    return choice ? choice.choice : '';
                                }
                                return '';
                            }), requireAccesory: (function (scale, answer) {
                                if (answer && answer.hasOwnProperty('answer') && answer.answer) {
                                    var choice = scale.choices.find(function (choice) { return choice._id.toString() === answer.answer.toString(); });
                                    return choice ? choice.requireAccesories : false;
                                }
                                return false;
                            }), getDamageItem: (function (items, item) {
                                if (item) {
                                    var result = items.find(function (i) { return i._id.toString() === item.toString(); });
                                    if (result && result.hasOwnProperty('name')) {
                                        return result.name;
                                    }
                                }
                                return '-';
                            }), logo: participantCompany.image && participantCompany.image.hasOwnProperty('url') ? decodeURI(participantCompany.image.url) : false, accesorySelected: function (answer, item) {
                                return item && answer.accesoriesAnswered ? answer.accesoriesAnswered.find(function (accesory) {
                                    return accesory.item === item._id.toString();
                                }) : false;
                            } }));
                        return [4 /*yield*/, this.createPDF(html, this.pdfConfig, filename)];
                    case 2:
                        pdfPath = _b.sent();
                        return [4 /*yield*/, this.uploadFile(pdfPath, filename)];
                    case 3:
                        url = _b.sent();
                        if (payload === null || payload === void 0 ? void 0 : payload.files) {
                            payload.files.push({ filename: filename, path: url });
                        }
                        else {
                            payload['files'] = [{ filename: filename, path: url }];
                        }
                        logger_service_1["default"].info("Trigger: files " + JSON.stringify(payload['files']));
                        logger_service_1["default"].info("Kind Trigger: " + trigger.kind + " executed");
                        return [2 /*return*/, payload];
                    case 4:
                        e_1 = _b.sent();
                        console.error(e_1);
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    FileTriggerDelegate.prototype.createPDF = function (html, options, filename) {
        return new Promise((function (resolve, reject) {
            HtmlPdf.create(html, options).toFile("/tmp/" + filename, function (err, file) {
                if (err !== null) {
                    reject(err);
                }
                else {
                    resolve(file.filename);
                }
            });
        }));
    };
    FileTriggerDelegate.prototype.uploadFile = function (filePath, filename) {
        return __awaiter(this, void 0, void 0, function () {
            var s3_1, data, s3FileOptions_1, upload, e_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        AWS.config.update({
                            accessKeyId: process.env.S3_KEY || s3Config.accessKeyId,
                            secretAccessKey: process.env.S3_SECRET || s3Config.secretAccessKey,
                            region: process.env.S3_REGION || s3Config.region // defaults to us-standard
                        });
                        s3_1 = new AWS.S3({
                            bucket: process.env.S3_BUCKET || s3Config.bucket,
                            acl: 'public-read',
                            region: process.env.S3_REGION || s3Config.region // defaults to us-standard
                        });
                        return [4 /*yield*/, fs.readFileSync(filePath)];
                    case 1:
                        data = _a.sent();
                        s3FileOptions_1 = {
                            Key: "/tmp/" + filename,
                            Bucket: process.env.S3_BUCKET || s3Config.bucket,
                            ACL: 'public-read',
                            Body: data
                        };
                        upload = function () { return new Promise((function (resolve, reject) {
                            s3_1.upload(s3FileOptions_1, function (err, data) {
                                if (err) {
                                    reject(err);
                                }
                                else {
                                    resolve(data.Location);
                                }
                            });
                        })); };
                        return [4 /*yield*/, upload()];
                    case 2: return [2 /*return*/, _a.sent()];
                    case 3:
                        e_2 = _a.sent();
                        logger_service_1["default"].error(e_2.stack);
                        return [2 /*return*/, ''];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    return FileTriggerDelegate;
}(nullTrigger_delegate_1["default"]));
exports["default"] = FileTriggerDelegate;
//# sourceMappingURL=fileTrigger.delegate.js.map