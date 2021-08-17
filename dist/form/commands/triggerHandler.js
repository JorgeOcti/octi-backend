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
var participant_model_1 = require("../models/participant.model");
var logger_service_1 = require("../../services/logger.service");
var trigger_model_1 = require("../models/trigger.model");
var app_1 = require("../../app");
var HtmlPdf = require("html-pdf");
var fs = require("fs");
var path = require("path");
var general_utils_1 = require("../../utils/general.utils");
var moment = require("moment-timezone");
var form_model_1 = require("../models/form.model");
var participantFile_model_1 = require("../models/participantFile.model");
var AWS = require("aws-sdk");
var s3Config = require("../../../s3-config.json");
var TriggerHandler = /** @class */ (function () {
    function TriggerHandler(form, participant, answers) {
        this.form = form;
        this.participant = participant;
        this.answers = answers ? answers : this.getAnswers();
    }
    TriggerHandler.prototype.getParticipantFullData = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = this;
                        return [4 /*yield*/, participant_model_1["default"]
                                .findOne({
                                _id: this.participant._id
                            }, {
                                name: true,
                                number: true,
                                user: true,
                                sections: true,
                                qualification: true,
                                shipping: true,
                                shippingText: true,
                                shippingImages: true,
                                carrier: true,
                                reception: true,
                                receptionText: true,
                                receptionImages: true,
                                conciliation: true,
                                conciliationText: true,
                                conciliationImages: true,
                                createdAt: true
                            })
                                .populate([{
                                    path: 'user',
                                    select: ['firstName', 'lastName', 'venue', 'email'],
                                    populate: [{
                                            path: 'venue',
                                            populate: [{
                                                    path: 'company'
                                                }]
                                        }]
                                }, {
                                    path: 'receiveFrom',
                                    select: 'name'
                                }, {
                                    path: 'venue',
                                    select: 'name'
                                }, {
                                    path: 'sendTo',
                                    select: 'name'
                                }, {
                                    path: 'carrierBy',
                                    select: 'name'
                                }, {
                                    path: 'car',
                                    select: ['vin', 'internalNumber', 'engineNumber', 'brand', 'denomination', 'color', 'patent']
                                }, {
                                    path: 'sections.answers.images'
                                }, {
                                    path: 'shippingImages'
                                }, {
                                    path: 'receptionImages'
                                }, {
                                    path: 'conciliationImages'
                                }]).lean()];
                    case 1:
                        _a.participant = _b.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    TriggerHandler.prototype.getAnswers = function () {
        var answers = {};
        this.participant.sections.map(function (s) {
            s.answers.map(function (a) {
                answers[a._id.toString()] = a.kind === form_model_1.KindQuestion.image ? a.images : a.comment;
            });
        });
        return answers;
    };
    TriggerHandler.prototype.execute = function (payload) {
        if (payload === void 0) { payload = {}; }
        return __awaiter(this, void 0, void 0, function () {
            var _i, _a, trigger, triggerDelegate;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.getParticipantFullData()];
                    case 1:
                        _b.sent();
                        _i = 0, _a = this.form.triggers;
                        _b.label = 2;
                    case 2:
                        if (!(_i < _a.length)) return [3 /*break*/, 5];
                        trigger = _a[_i];
                        if (!trigger.enabled) {
                            logger_service_1["default"].info("Trigger: " + trigger.name + " deactivated");
                            return [3 /*break*/, 4];
                        }
                        triggerDelegate = this.getTrigger(trigger);
                        return [4 /*yield*/, triggerDelegate.trigger(trigger, this.answers, __assign(__assign({}, payload), { participant: this.participant, user: this.participant.user }))];
                    case 3:
                        payload = _b.sent();
                        _b.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    TriggerHandler.prototype.getTrigger = function (trigger) {
        var delegate = new NullTriggerDelegate();
        switch (trigger.kind) {
            case trigger_model_1.KindTrigger.email: {
                delegate = new EmailTriggerDelegate();
                break;
            }
            case trigger_model_1.KindTrigger.file: {
                delegate = new FileTriggerDelegate();
                break;
            }
        }
        return delegate;
    };
    return TriggerHandler;
}());
exports["default"] = TriggerHandler;
var NullTriggerDelegate = /** @class */ (function () {
    function NullTriggerDelegate() {
    }
    NullTriggerDelegate.prototype.processTrigerConfig = function (trigger, answers) {
        var data = {};
        Object.keys(trigger.config.toJSON()).map(function (k) {
            data[k] = answers.hasOwnProperty(trigger.config[k].toString()) ?
                answers[trigger.config[k].toString()] : trigger.config[k].toString();
        });
        return data;
    };
    NullTriggerDelegate.prototype.trigger = function (trigger, answers, payload) {
        logger_service_1["default"].error("Kind Trigger: " + trigger.kind + " not implemented ");
    };
    return NullTriggerDelegate;
}());
var EmailTriggerDelegate = /** @class */ (function (_super) {
    __extends(EmailTriggerDelegate, _super);
    function EmailTriggerDelegate() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    EmailTriggerDelegate.prototype.validateEmail = function (email) {
        var re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    };
    EmailTriggerDelegate.prototype.trigger = function (trigger, answers, payload) {
        logger_service_1["default"].info("Kind Trigger: " + trigger.kind + " performing");
        var data = this.processTrigerConfig(trigger, __assign(__assign({}, answers), payload.user));
        if (!this.validateEmail(data.email))
            return payload;
        app_1.queue.create('email', {
            from: '',
            title: "\"" + data.subject + " | " + data.fullname,
            to: "\"" + data.fullname + "\"<" + data.email + ">",
            subject: "" + data.subject,
            text: "",
            attachments: payload.files || [],
            view: trigger.config.template,
            context: __assign(__assign(__assign({}, payload), data), answers)
        }).priority('high').attempts(5).save();
        return payload;
    };
    return EmailTriggerDelegate;
}(NullTriggerDelegate));
var FileTriggerDelegate = /** @class */ (function (_super) {
    __extends(FileTriggerDelegate, _super);
    function FileTriggerDelegate() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    FileTriggerDelegate.prototype.uploadFile = function (filePath, filename) {
        return __awaiter(this, void 0, void 0, function () {
            var s3_1, data, s3FileOptions_1, upload, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        AWS.config.update({
                            accessKeyId: process.env.S3_KEY || s3Config.accessKeyId,
                            secretAccessKey: process.env.S3_SECRET || s3Config.secretAccessKey,
                            region: process.env.S3_REGION || s3Config.region
                        });
                        s3_1 = new AWS.S3({
                            bucket: process.env.S3_BUCKET || s3Config.bucket,
                            acl: 'public-read',
                            region: process.env.S3_REGION || s3Config.region
                        });
                        return [4 /*yield*/, fs.readFileSync(filePath)];
                    case 1:
                        data = _a.sent();
                        s3FileOptions_1 = {
                            Key: "/tmp/" + filename,
                            Bucket: process.env.S3_BUCKET || s3Config.bucket,
                            ACL: "public-read",
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
                        e_1 = _a.sent();
                        logger_service_1["default"].error(e_1.stack);
                        return [2 /*return*/, ""];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    FileTriggerDelegate.prototype.trigger = function (trigger, answers, payload) {
        return __awaiter(this, void 0, void 0, function () {
            var data, filename, participant, participantCompany, config, _a, css, templatePath, html, createPDF, PDF, URL;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        logger_service_1["default"].info("Kind Trigger: " + trigger.kind + " performing");
                        data = this.processTrigerConfig(trigger, answers);
                        filename = moment().unix() + "_" + data.filename;
                        participant = payload.participant;
                        participantCompany = participant.user.venue && participant.user.venue.company || {};
                        config = {
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
                        _a = data;
                        return [4 /*yield*/, participantFile_model_1["default"].find({ _id: { $in: data.signature } })];
                    case 1:
                        _a.signature = (_b.sent()).map(function (f) { return f.file.url; })[0];
                        moment.locale('es');
                        moment.tz.setDefault('America/Santiago');
                        css = fs.readFileSync(path.join(__dirname, '../../../views/') + 'form/carDetail/style.css', 'utf8');
                        templatePath = path.join(__dirname, '../../../views/') + data.template;
                        html = general_utils_1["default"].generateHtmlFromPugFile(templatePath, __assign(__assign(__assign(__assign({}, payload), answers), data), { css: css.replace(/(\r\n|\n|\r)/gm, ''), moment: moment, origin: function () {
                                if (participant.reception && participant.receiveFrom) {
                                    return participant.receiveFrom.name;
                                }
                                if (participant.shipping && participant.venue) {
                                    return participant.venue.name;
                                }
                                return false;
                            }, destination: function () {
                                if (participant.reception && participant.venue) {
                                    return participant.venue.name;
                                }
                                if (participant.shipping && participant.sendTo) {
                                    return participant.sendTo.name;
                                }
                                return false;
                            }, carrier: function () {
                                if (participant.carrier && participant.carrierBy) {
                                    return participant.carrierBy.name;
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
                        createPDF = function (html, options) { return new Promise((function (resolve, reject) {
                            HtmlPdf.create(html, options).toFile("/tmp/" + filename, function (err, file) {
                                if (err !== null) {
                                    reject(err);
                                }
                                else {
                                    resolve(file.filename);
                                }
                            });
                        })); };
                        return [4 /*yield*/, createPDF(html, config)];
                    case 2:
                        PDF = _b.sent();
                        return [4 /*yield*/, this.uploadFile(PDF, filename)];
                    case 3:
                        URL = _b.sent();
                        if (payload.hasOwnProperty('files')) {
                            payload.file.push({ filename: filename, path: URL });
                        }
                        else {
                            payload['files'] = [{ filename: filename, path: URL }];
                        }
                        return [2 /*return*/, payload];
                }
            });
        });
    };
    return FileTriggerDelegate;
}(NullTriggerDelegate));
//# sourceMappingURL=triggerHandler.js.map