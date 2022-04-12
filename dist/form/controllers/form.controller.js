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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
exports.__esModule = true;
var excel = require("exceljs");
var tempfile = require("tempfile");
var bson_1 = require("bson");
var fs = require("fs");
var GraphicsMagick = require("gm");
var HtmlPdf = require("html-pdf");
var Joi = require("joi");
var moment = require("moment-timezone");
var path = require("path");
var QRCode = require("qrcode");
var Raven = require("raven");
var app_1 = require("../../app");
var alert_model_1 = require("../../app/models/alert.model");
var car_model_1 = require("../../app/models/car.model");
var team_model_1 = require("../../app/models/team.model");
var user_model_1 = require("../../app/models/user.model");
var user_model_2 = require("../../app/models/user.model");
var venue_model_1 = require("../../app/models/venue.model");
var gpsPosition_model_1 = require("../models/gpsPosition.model");
var server_1 = require("../../server");
var logger_service_1 = require("../../services/logger.service");
var redis_service_1 = require("../../services/redis.service");
var general_utils_1 = require("../../utils/general.utils");
var form_model_1 = require("../models/form.model");
var participant_model_1 = require("../models/participant.model");
var participantFile_model_1 = require("../models/participantFile.model");
var scale_model_1 = require("../models/scale.model");
var bluebird = require("bluebird");
var activityHistory_model_1 = require("../../billing/models/activityHistory.model");
var triggerHandler_1 = require("./triggers/triggerHandler");
var transmittalItem_model_1 = require("../../distribution/models/transmittalItem.model");
var transmittal_controller_1 = require("../../distribution/controllers/transmittal.controller");
var request_controller_1 = require("../../request/controllers/request.controller");
var transmittal_model_1 = require("../../distribution/models/transmittal.model");
var requestItem_model_1 = require("../../request/models/requestItem.model");
var milestone_model_1 = require("../../distribution/models/milestone.model");
var car_model_2 = require("../../app/models/car.model");
// import {ValidationResult} from 'joi';
// import * as puppeteer from 'puppeteer';
var DERCO_TEAM = '5bf2de34caf8ef7096105cda';
var FormController = /** @class */ (function () {
    function FormController() {
        this.list = this.list.bind(this);
        this.detail = this.detail.bind(this);
        this.pdf = this.pdf.bind(this);
        this.complete = this.complete.bind(this);
        this.changePreferred = this.changePreferred.bind(this);
        this.uploadFile = this.uploadFile.bind(this);
        this.damagesDashboardPerDay = this.damagesDashboardPerDay.bind(this);
        this.participantWithDamages = this.participantWithDamages.bind(this);
        this.timingDashboard = this.timingDashboard.bind(this);
    }
    FormController.prototype.pdf = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, debug, timezone, id, team, config, venuesPermissions, participant_1, css, templatePath, participantCompany, html, _b, _c, _d, e_1;
            var _e;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        _a = req.query, debug = _a.debug, timezone = _a.timezone;
                        id = req.params.id;
                        team = req.user.team._id;
                        _f.label = 1;
                    case 1:
                        _f.trys.push([1, 4, , 5]);
                        config = {
                            directory: '/tmp',
                            format: 'Letter',
                            orientation: 'portrait',
                            border: {
                                top: '0.3in',
                                right: '0.5in',
                                bottom: '0.3in',
                                left: '0.5in'
                            },
                            /*
                            header: {
                              height: '2mm',
                              contents: `<div class="header">
                                  Reporte generado por OSA Andes. Página <span>{{page}}</span>/<span>{{pages}}</span>
                              </div>`
                            },
                            footer: {
                              contents: {
                                default: `<div class="footer">
                                    Reporte generado por OSA Andes. Página <span>{{page}}</span>/<span>{{pages}}</span>
                                </div>`
                              }
                            },
                            */
                            type: 'pdf',
                            quality: '75'
                        };
                        venuesPermissions = req.user.venuesPermissions();
                        return [4 /*yield*/, participant_model_1["default"]
                                .findOne({
                                _id: id,
                                team: team,
                                $or: [{
                                        venue: {
                                            $in: venuesPermissions
                                        }
                                    }, {
                                        venue: {
                                            $exists: false
                                        }
                                    }, {
                                        venue: null
                                    }]
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
                                    select: ['firstName', 'lastName', 'venue'],
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
                    case 2:
                        participant_1 = _f.sent();
                        moment.locale('es');
                        moment.tz.setDefault(timezone ? timezone : 'America/Santiago');
                        css = fs.readFileSync(path.join(__dirname, '../../../views/') + 'form/carDetail/style.css', 'utf8');
                        templatePath = path.join(__dirname, '../../../views/') + 'form/carDetail/index.pug';
                        participantCompany = participant_1.user.venue && participant_1.user.venue.company || {};
                        _c = (_b = general_utils_1["default"]).generateHtmlFromPugFile;
                        _d = [templatePath];
                        _e = {
                            css: css.replace(/(\r\n|\n|\r)/gm, ''),
                            participant: participant_1
                        };
                        return [4 /*yield*/, QRCode.toDataURL(participant_1.car.vin, {
                                errorCorrectionLevel: 'H',
                                margin: 0,
                                rendererOpts: {
                                    quality: 1
                                }
                            })];
                    case 3:
                        html = _c.apply(_b, _d.concat([(_e.qr = _f.sent(),
                                _e.moment = moment,
                                _e.origin = function () {
                                    if (participant_1.reception && participant_1.receiveFrom) {
                                        return participant_1.receiveFrom.name;
                                    }
                                    if (participant_1.shipping && participant_1.venue) {
                                        return participant_1.venue.name;
                                    }
                                    return false;
                                },
                                _e.destination = function () {
                                    if (participant_1.reception && participant_1.venue) {
                                        return participant_1.venue.name;
                                    }
                                    if (participant_1.shipping && participant_1.sendTo) {
                                        return participant_1.sendTo.name;
                                    }
                                    return false;
                                },
                                _e.carrier = function () {
                                    if (participant_1.carrier && participant_1.carrierBy) {
                                        return participant_1.carrierBy.name;
                                    }
                                    return false;
                                },
                                _e.getAnswer = (function (scale, answer) {
                                    if (answer && answer.hasOwnProperty('answer') && answer.answer) {
                                        var choice = scale.choices.find(function (choice) { return choice._id.toString() === answer.answer.toString(); });
                                        return choice ? choice.choice : '';
                                    }
                                    return '';
                                }),
                                _e.requireAccesory = (function (scale, answer) {
                                    if (answer && answer.hasOwnProperty('answer') && answer.answer) {
                                        var choice = scale.choices.find(function (choice) { return choice._id.toString() === answer.answer.toString(); });
                                        return choice ? choice.requireAccesories : false;
                                    }
                                    return false;
                                }),
                                _e.getDamageItem = (function (items, item) {
                                    if (item) {
                                        var result = items.find(function (i) { return i._id.toString() === item.toString(); });
                                        if (result && result.hasOwnProperty('name')) {
                                            return result.name;
                                        }
                                    }
                                    return '-';
                                }),
                                _e.logo = participantCompany.image && participantCompany.image.hasOwnProperty('url') ? decodeURI(participantCompany.image.url) : false,
                                _e.accesorySelected = function (answer, item) {
                                    return item && answer.accesoriesAnswered ? answer.accesoriesAnswered.find(function (accesory) {
                                        return accesory.item === item._id.toString();
                                    }) : false;
                                },
                                _e)]));
                        if (debug) {
                            res.send(html);
                        }
                        else {
                            /*const browser = await puppeteer.launch();
                            const page = await browser.newPage();
                            await page.goto(`http://localhost:3030/report/forms/pdf/${id}.pdf?debug=true`);
                            const buffer = await page.pdf({
                              format: 'Letter',
                              margin: {
                                top: '0.3in',
                                right: '0.5in',
                                bottom: '0.3in',
                                left: '0.5in'
                              }
                            });
                            res.type('application/pdf');
                            res.send(buffer);
                            browser.close();
                            */
                            HtmlPdf.create(html, config).toStream(function (err, pdfStream) {
                                if (err) {
                                    console.log(err);
                                    res.sendStatus(500);
                                }
                                else {
                                    // set header
                                    res.setHeader('Content-Type', 'application/pdf');
                                    res.setHeader('Content-disposition', "inline; filename=".concat(participant_1._id.toString(), ".pdf"));
                                    // res.setHeader('Content-disposition', `attachment; filename=${participant._id.toString()}.pdf`);
                                    // send a status code of 200 OK
                                    res.statusCode = 200;
                                    // once we are done reading end the response
                                    pdfStream.on('end', function () {
                                        // done reading
                                        res.end();
                                    });
                                    // pipe the contents of the PDF directly to the response
                                    pdfStream.pipe(res);
                                }
                            });
                        }
                        return [3 /*break*/, 5];
                    case 4:
                        e_1 = _f.sent();
                        Raven.captureException(e_1, { req: req });
                        res.status(500).json(e_1.message);
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    FormController.prototype.list = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var team, updatedUser, forms, e_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        team = req.user.team._id;
                        logger_service_1["default"].info("list forms");
                        logger_service_1["default"].info("{user: {_id: ".concat(req.user._id, ", email: ").concat(req.user.email, "}}"));
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 6, , 7]);
                        return [4 /*yield*/, user_model_1["default"].findById(req.user._id).populate([{
                                    path: 'userForms',
                                    select: ['_id']
                                }])];
                    case 2:
                        updatedUser = _a.sent();
                        if (!updatedUser) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.getForms({
                                _id: {
                                    $in: updatedUser.userForms.map(function (form) { return form._id; })
                                },
                                team: team
                            })];
                    case 3:
                        forms = _a.sent();
                        res.json({
                            data: forms,
                            status: 200
                        });
                        return [3 /*break*/, 5];
                    case 4:
                        /* istanbul ignore next */
                        res.status(400).json({
                            message: 'Usuario no encontrado',
                            status: 400
                        });
                        _a.label = 5;
                    case 5: return [3 /*break*/, 7];
                    case 6:
                        e_2 = _a.sent();
                        Raven.captureException(e_2, { req: req });
                        /* istanbul ignore next */
                        logger_service_1["default"].error("Async Error.");
                        res.status(400).json({
                            message: 'Ha ocurrido un error',
                            status: 400
                        });
                        return [3 /*break*/, 7];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    FormController.prototype.detail = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var id, team, user, form, scalesIds_1, extra, extraSection, extraScales, response, scales, baseQuestion_1, e_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        id = req.params.id;
                        team = req.user.team._id;
                        logger_service_1["default"].info("detail forms");
                        logger_service_1["default"].info("{user: {_id: ".concat(req.user._id, ", email: ").concat(req.user.email, "}, {form: ").concat(id, "}}"));
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 6, , 7]);
                        return [4 /*yield*/, user_model_1["default"].find({ _id: req.user._id, userForms: id }).count()];
                    case 2:
                        if ((_a.sent()) < 1) {
                            return [2 /*return*/, res.status(403).json({
                                    message: 'No tienes permisos para esta operación'
                                })];
                        }
                        return [4 /*yield*/, user_model_2["default"].findById(req.user._id, {
                                venue: true
                            }).populate([{
                                    path: 'venue',
                                    populate: [{
                                            path: 'sendTo',
                                            select: ['name'],
                                            options: {
                                                sort: {
                                                    name: 1
                                                }
                                            }
                                        }, {
                                            path: 'receiveFrom',
                                            select: ['name'],
                                            options: {
                                                sort: {
                                                    name: 1
                                                }
                                            }
                                        }, {
                                            path: 'receptionCarriers',
                                            select: ['name'],
                                            options: {
                                                sort: {
                                                    name: 1
                                                }
                                            }
                                        }, {
                                            path: 'shippingCarriers',
                                            select: ['name'],
                                            options: {
                                                sort: {
                                                    name: 1
                                                }
                                            }
                                        }]
                                }])];
                    case 3:
                        user = _a.sent();
                        return [4 /*yield*/, this.getForm({
                                _id: id,
                                team: team
                            })];
                    case 4:
                        form = _a.sent();
                        scalesIds_1 = [];
                        form.sections.forEach(function (section) {
                            section.questions.forEach(function (question) {
                                var scaleID = question.scale ? question.scale.toString() : null;
                                if (scaleID && !scalesIds_1.includes(scaleID)) {
                                    scalesIds_1.push(scaleID);
                                }
                            });
                        });
                        extra = {
                            accessories: []
                        };
                        extraSection = {
                            _id: 'extraSection',
                            name: '',
                            questions: [],
                            weight: 0,
                            order: form.sections.length + 1
                        };
                        extraScales = [];
                        response = {};
                        if (form.shippingVenue) {
                            extraSection.questions.push({
                                _id: 'shippingVenue',
                                question: form.shippingVenueText,
                                venues: user.venue.sendTo,
                                kind: form_model_1.KindQuestion.venue,
                                order: extraSection.questions.length + 1
                            });
                        }
                        if (form.shipping) {
                            extraSection.questions.push({
                                _id: 'shipping',
                                question: form.shippingText,
                                scale: 'shipping',
                                kind: form_model_1.KindQuestion.scale,
                                order: extraSection.questions.length + 1
                            });
                            extraScales.push({
                                _id: 'shipping',
                                name: 'shipping',
                                choices: [
                                    {
                                        _id: 'false',
                                        choice: 'No',
                                        backgroundColor: 'red',
                                        requireImage: form.shippingImage,
                                        requireComment: false,
                                        requireAccesories: false,
                                        requireConciliation: false,
                                        value: 0,
                                        order: 1
                                    }, {
                                        _id: 'true',
                                        choice: 'Si',
                                        backgroundColor: 'green',
                                        requireImage: false,
                                        requireComment: false,
                                        requireAccesories: false,
                                        requireConciliation: false,
                                        value: 1,
                                        order: 2
                                    }
                                ]
                            });
                        }
                        if (form.receptionVenue) {
                            extraSection.questions.push({
                                _id: 'receptionVenue',
                                question: form.receptionVenueText,
                                venues: user.venue.receiveFrom,
                                kind: form_model_1.KindQuestion.venue,
                                order: extraSection.questions.length + 1
                            });
                        }
                        if (form.reception) {
                            extraSection.questions.push({
                                _id: 'reception',
                                question: form.receptionText,
                                scale: 'reception',
                                kind: form_model_1.KindQuestion.scale,
                                order: extraSection.questions.length + 1
                            });
                            extraScales.push({
                                _id: 'reception',
                                name: 'reception',
                                choices: [
                                    {
                                        _id: 'false',
                                        choice: 'No',
                                        backgroundColor: 'red',
                                        requireImage: form.receptionImage,
                                        requireComment: false,
                                        requireAccesories: false,
                                        requireConciliation: false,
                                        value: 0,
                                        order: 1
                                    }, {
                                        _id: 'true',
                                        choice: 'Si',
                                        backgroundColor: 'green',
                                        requireImage: false,
                                        requireComment: false,
                                        requireAccesories: false,
                                        requireConciliation: false,
                                        value: 1,
                                        order: 2
                                    }
                                ]
                            });
                        }
                        if (form.carrier && (form.reception || form.shipping)) {
                            extraSection.questions.push({
                                _id: 'carrier',
                                question: form.carrierText,
                                carriers: form.reception ? user.venue.receptionCarriers : user.venue.shippingCarriers,
                                kind: form_model_1.KindQuestion.carrier,
                                order: extraSection.questions.length + 1
                            });
                        }
                        if (form.conciliation) {
                            extraSection.questions.push({
                                _id: 'conciliation',
                                question: form.conciliationText,
                                scale: 'conciliation',
                                kind: form_model_1.KindQuestion.scale,
                                order: extraSection.questions.length + 1
                            });
                            extraScales.push({
                                _id: 'conciliation',
                                name: 'conciliation',
                                choices: [
                                    {
                                        _id: 'false',
                                        choice: 'No',
                                        backgroundColor: 'red',
                                        requireImage: false,
                                        requireComment: false,
                                        requireAccesories: false,
                                        requireConciliation: false,
                                        value: 0,
                                        order: 1
                                    }, {
                                        _id: 'true',
                                        choice: 'Si',
                                        backgroundColor: 'green',
                                        requireImage: form.conciliationImage,
                                        requireComment: false,
                                        requireAccesories: false,
                                        requireConciliation: false,
                                        value: 1,
                                        order: 2
                                    }
                                ]
                            });
                        }
                        return [4 /*yield*/, this.getScales({
                                _id: {
                                    $in: scalesIds_1
                                },
                                team: team
                            })];
                    case 5:
                        scales = _a.sent();
                        scales = __spreadArray(__spreadArray([], scales, true), extraScales, true);
                        if (extraSection.questions.length) {
                            form.sections = __spreadArray(__spreadArray([], form.sections, true), [extraSection], false);
                        }
                        baseQuestion_1 = {
                            _id: '',
                            question: '',
                            scale: null,
                            risk: '',
                            observe: '',
                            accessories: null,
                            damages: null,
                            venues: [],
                            carriers: [],
                            conciliation: false,
                            kind: '',
                            weight: 0,
                            order: 0,
                            optional: false,
                            hint: ''
                        };
                        // get scales from db
                        res.json({
                            data: __assign({ form: {
                                    _id: form._id,
                                    name: form.name,
                                    description: form.description,
                                    // norrmalize questions in sections
                                    sections: form.sections.map(function (section) {
                                        return {
                                            _id: section._id,
                                            name: section.name,
                                            questions: section.questions.map(function (question) {
                                                return __assign(__assign({}, baseQuestion_1), question);
                                            }),
                                            weight: section.weight,
                                            order: section.order
                                        };
                                    })
                                }, scales: scales, extra: extra }, response),
                            status: 200
                        });
                        return [3 /*break*/, 7];
                    case 6:
                        e_3 = _a.sent();
                        Raven.captureException(e_3, { req: req });
                        /* istanbul ignore next */
                        logger_service_1["default"].error("detail form: Async Error.");
                        /* istanbul ignore next */
                        logger_service_1["default"].error("{user: {_id: ".concat(req.user._id, ", email: ").concat(req.user.email, "}}"));
                        /* istanbul ignore next */
                        logger_service_1["default"].error(e_3);
                        /* istanbul ignore next */
                        Raven.captureException(e_3, { req: req });
                        /* istanbul ignore next */
                        res.status(500).json({
                            message: 'No se encontro formularío',
                            status: 500
                        });
                        return [3 /*break*/, 7];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    FormController.prototype.complete = function (req, res) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var id, _b, vin, answers, transmittalItem, transmittal, _c, company, venue, team, updatedUser, car_1, form, participantObject, reception, receptionVenue, shipping, shippingVenue, carrier, conciliation, newParticipant, sumSectionWeigths, sumSectionQualifications, allImages, _i, _d, section, sumWeigths, sumQualifications, newAnswers, _loop_1, this_1, _e, _f, question, sectionQualification, formQualification_1, updateTeam, transmittalItemData, milestone, requestItem, milestone, requestItems, newTransmittal, _g, requestItems_1, requestItem, _h, _j, _k, today, tomorrow, count, triggersHandler, alerts, e_4, e_5;
            var _this = this;
            return __generator(this, function (_l) {
                switch (_l.label) {
                    case 0:
                        id = req.params.id;
                        _b = req.body, vin = _b.vin, answers = _b.answers, transmittalItem = _b.transmittalItem, transmittal = _b.transmittal;
                        _c = req.user, company = _c.company, venue = _c.venue, team = _c.team;
                        logger_service_1["default"].info("complete");
                        logger_service_1["default"].info("{user: {_id: ".concat(req.user._id, ", email: ").concat(req.user.email, "}, body: ").concat(JSON.stringify(req.body), "}"));
                        // validate answers in body
                        if (!answers) {
                            return [2 /*return*/, res.status(400).json({
                                    message: 'Debes enviar las respuestas',
                                    status: 400
                                })];
                        }
                        // validate vin in body
                        if (!vin && !transmittal) {
                            return [2 /*return*/, res.status(400).json({
                                    message: 'Debes enviar el vin o OT',
                                    status: 400
                                })];
                        }
                        return [4 /*yield*/, user_model_1["default"].findById(req.user._id).populate([{ path: 'venue' }])];
                    case 1:
                        updatedUser = _l.sent();
                        if (!updatedUser) {
                            return [2 /*return*/, res.status(404).json({
                                    message: 'No se ha encontrado el formulario solicitado.',
                                    status: 404
                                })];
                        }
                        _l.label = 2;
                    case 2:
                        _l.trys.push([2, 49, , 50]);
                        car_1 = null;
                        if (!vin) return [3 /*break*/, 4];
                        vin = vin.replace(/[\W_]+/g, '');
                        return [4 /*yield*/, car_model_1["default"].findOne({
                                $or: [{ vin: { $eq: vin } }, { vin2: { $eq: vin } }],
                                team: team
                            })];
                    case 3:
                        car_1 = _l.sent();
                        _l.label = 4;
                    case 4:
                        if (!(car_1 || transmittal)) return [3 /*break*/, 47];
                        return [4 /*yield*/, this.getFormWithScale({
                                _id: id,
                                team: team
                            })];
                    case 5:
                        form = _l.sent();
                        if (!form) return [3 /*break*/, 45];
                        participantObject = {
                            name: form.name,
                            team: team,
                            company: company,
                            form: form._id,
                            car: car_1,
                            transmittal: transmittal,
                            description: form.description,
                            user: req.user._id,
                            venue: updatedUser.venue,
                            active: form.active,
                            kind: transmittal ? form_model_1.KindForm.transmittal : form.kind
                        };
                        if (!form.reception) return [3 /*break*/, 7];
                        participantObject.reception = form.reception;
                        participantObject.receptionText = form.receptionText;
                        participantObject.receptionVenue = form.receptionVenue;
                        participantObject.receptionVenueText = form.receptionVenueText;
                        if ('reception' in answers) {
                            reception = answers.reception;
                            participantObject.receptionConfirmation = [true, 'true'].includes(reception.value);
                            if (reception.images) {
                                participantObject.receptionImages = reception.images.map(function (image) { return (new bson_1.ObjectID(image)); });
                            }
                        }
                        if ('receptionVenue' in answers) {
                            receptionVenue = answers.receptionVenue;
                            participantObject.receiveFrom = receptionVenue.value;
                        }
                        if (!(car_1 === null || car_1 === void 0 ? void 0 : car_1._id)) return [3 /*break*/, 7];
                        return [4 /*yield*/, car_model_2["default"].updateOne({ _id: car_1._id }, {
                                'meta.location.venue': updatedUser.venue,
                                'meta.location.checkedDate': new Date()
                            })];
                    case 6:
                        _l.sent();
                        _l.label = 7;
                    case 7:
                        if (form.shipping) {
                            participantObject.shipping = form.shipping;
                            participantObject.shippingText = form.shippingText;
                            participantObject.shippingVenue = form.shippingVenue;
                            participantObject.shippingVenueText = form.shippingVenueText;
                            if ('shipping' in answers) {
                                shipping = answers.shipping;
                                participantObject.shippingConfirmation = [true, 'true'].includes(shipping.value);
                                if (shipping.images) {
                                    participantObject.shippingImages = shipping.images.map(function (image) { return (new bson_1.ObjectID(image)); });
                                }
                            }
                            if ('shippingVenue' in answers) {
                                shippingVenue = answers.shippingVenue;
                                participantObject.sendTo = shippingVenue.value;
                            }
                        }
                        if (form.carrier) {
                            participantObject.carrier = form.carrier;
                            participantObject.carrierText = form.carrierText;
                            if ('carrier' in answers) {
                                carrier = answers.carrier;
                                participantObject.carrierBy = carrier.value;
                            }
                        }
                        if (form.conciliation && 'conciliation' in answers) {
                            conciliation = answers.conciliation;
                            participantObject.conciliation = [true, 'true'].includes(conciliation.value);
                            participantObject.conciliationText = form.conciliationText;
                            if (conciliation.images) {
                                participantObject.conciliationImages = conciliation.images.map(function (image) { return (new bson_1.ObjectID(image)); });
                            }
                        }
                        newParticipant = new participant_model_1["default"](participantObject);
                        sumSectionWeigths = 0;
                        sumSectionQualifications = 0;
                        allImages = [];
                        _i = 0, _d = form.sections;
                        _l.label = 8;
                    case 8:
                        if (!(_i < _d.length)) return [3 /*break*/, 14];
                        section = _d[_i];
                        sumWeigths = 0;
                        sumQualifications = 0;
                        newAnswers = [];
                        _loop_1 = function (question) {
                            var questionID, answer, choice, qualification, na, _m, _o, _p;
                            var _q;
                            return __generator(this, function (_r) {
                                switch (_r.label) {
                                    case 0:
                                        questionID = question._id.toString();
                                        answer = general_utils_1["default"].getObjectProperty(answers, questionID, null);
                                        choice = question.scale ? question.scale.choices.find(function (choice) {
                                            return answer ? choice._id.toString() === answer.value : false;
                                        }) : null;
                                        qualification = 0;
                                        if (choice) {
                                            qualification = (100 / question.scale.maxValue) * choice.value;
                                        }
                                        na = false;
                                        if (choice && choice.na) {
                                            na = true;
                                        }
                                        else {
                                            sumQualifications += (qualification * question.weight);
                                            sumWeigths += question.weight;
                                        }
                                        // concat allImages
                                        if (choice && choice.requireImage && answer && answer.images && answer.images.length) {
                                            allImages = __spreadArray(__spreadArray([], answer.images, true), allImages, true);
                                        }
                                        // delete images no used
                                        if (choice && !choice.requireImage && answer && answer.images && answer.images.length) {
                                            answer.images.forEach(function (image) { return __awaiter(_this, void 0, void 0, function () {
                                                var deleteFile;
                                                return __generator(this, function (_a) {
                                                    switch (_a.label) {
                                                        case 0: return [4 /*yield*/, participantFile_model_1["default"].findById(image)];
                                                        case 1:
                                                            deleteFile = _a.sent();
                                                            if (!deleteFile) return [3 /*break*/, 3];
                                                            return [4 /*yield*/, deleteFile.remove()];
                                                        case 2:
                                                            _a.sent();
                                                            _a.label = 3;
                                                        case 3: return [2 /*return*/];
                                                    }
                                                });
                                            }); });
                                        }
                                        // generate answer
                                        _o = (_m = newAnswers).push;
                                        _q = {
                                            _id: question._id,
                                            question: question.question,
                                            shortName: question.shortName,
                                            scale: question.scale,
                                            conciliation: question.conciliation,
                                            accessories: question.accessories,
                                            damages: question.damages,
                                            damagesSelected: answer && answer.damages ? answer.damages : []
                                        };
                                        if (!((question.kind === form_model_1.KindQuestion.accessory || choice && choice.requireAccesories) && answer && answer.accesories)) return [3 /*break*/, 2];
                                        return [4 /*yield*/, this_1.processAccesoryItems(answer.accesories)];
                                    case 1:
                                        _p = _r.sent();
                                        return [3 /*break*/, 3];
                                    case 2:
                                        _p = [];
                                        _r.label = 3;
                                    case 3:
                                        // generate answer
                                        _o.apply(_m, [(_q.accesoriesAnswered = _p,
                                                _q.risk = question.risk,
                                                _q.comment = (question.kind === form_model_1.KindQuestion.text || choice && choice.requireComment) && answer && answer.comment ?
                                                    answer.comment
                                                    : '',
                                                _q.observe = question.observe,
                                                _q.answer = answer ? new bson_1.ObjectID(answer.value) : null,
                                                _q.images = answer && answer.images && answer.images.length ?
                                                    answer.images.map(function (image) { return (new bson_1.ObjectID(image)); })
                                                    : [],
                                                _q.qualification = qualification,
                                                _q.na = na,
                                                _q.weight = question.weight,
                                                _q.kind = question.kind,
                                                _q.order = question.order,
                                                _q.hint = question.hint,
                                                _q.optional = question.optional,
                                                _q.minValue = question.minValue,
                                                _q.maxValue = question.maxValue,
                                                _q.score = answer && answer.score ? answer.score : -1,
                                                _q)]);
                                        return [2 /*return*/];
                                }
                            });
                        };
                        this_1 = this;
                        _e = 0, _f = section.questions;
                        _l.label = 9;
                    case 9:
                        if (!(_e < _f.length)) return [3 /*break*/, 12];
                        question = _f[_e];
                        return [5 /*yield**/, _loop_1(question)];
                    case 10:
                        _l.sent();
                        _l.label = 11;
                    case 11:
                        _e++;
                        return [3 /*break*/, 9];
                    case 12:
                        sectionQualification = sumQualifications ? sumQualifications / sumWeigths : 0;
                        sumSectionQualifications += (sectionQualification * section.weight);
                        sumSectionWeigths += section.weight;
                        // generate answer section
                        newParticipant.sections.push({
                            _id: section._id,
                            name: section.name,
                            shortName: section.shortName,
                            answers: newAnswers,
                            qualification: sectionQualification,
                            weight: section.weight,
                            order: section.order
                        });
                        _l.label = 13;
                    case 13:
                        _i++;
                        return [3 /*break*/, 8];
                    case 14:
                        formQualification_1 = sumSectionQualifications ? sumSectionQualifications / sumSectionWeigths : 0;
                        newParticipant.qualification = formQualification_1;
                        newParticipant.hasDamages = newParticipant.sections.some(function (section) {
                            return section.answers.some(function (answer) {
                                return answer.damagesSelected.length > 0;
                            });
                        });
                        _l.label = 15;
                    case 15:
                        _l.trys.push([15, 43, , 44]);
                        return [4 /*yield*/, team_model_1["default"].findOneAndUpdate({ _id: team._id }, { $inc: { formsNumber: 1 } }, { "new": true })];
                    case 16:
                        updateTeam = _l.sent();
                        if (updateTeam) {
                            newParticipant.number = updateTeam.formsNumber;
                        }
                        // save the participant
                        return [4 /*yield*/, newParticipant.save()];
                    case 17:
                        // save the participant
                        _l.sent();
                        if (!(transmittalItem === null || transmittalItem === void 0 ? void 0 : transmittalItem.length)) return [3 /*break*/, 23];
                        newParticipant.transmittalItem = transmittalItem;
                        return [4 /*yield*/, newParticipant.save()];
                    case 18:
                        _l.sent();
                        return [4 /*yield*/, transmittalItem_model_1["default"]
                                .findOneAndUpdate({ _id: transmittalItem }, { $push: { revisions: newParticipant._id } }, { "new": true })
                                .populate(transmittal_controller_1["default"].itemPopulate)];
                    case 19:
                        transmittalItemData = _l.sent();
                        return [4 /*yield*/, milestone_model_1["default"].findOne({
                                step: milestone_model_1.ChoicesStepMilestone.checkItem,
                                team: team
                            })];
                    case 20:
                        milestone = _l.sent();
                        if (!(milestone === null || milestone === void 0 ? void 0 : milestone.requestItemStatus)) return [3 /*break*/, 22];
                        return [4 /*yield*/, requestItem_model_1["default"]
                                .findOneAndUpdate({ transmittalItem: transmittalItem }, { $set: { status: milestone.requestItemStatus } }, { "new": true })
                                .populate(request_controller_1["default"].itemPopulate)];
                    case 21:
                        requestItem = _l.sent();
                        if (requestItem) {
                            server_1.io.to("request-list-".concat(team._id)).emit('UPDATE_REQUEST_ITEM', {
                                idRequest: requestItem.request._id,
                                item: requestItem
                            });
                            server_1.io.to("request-detail-".concat(team._id)).emit('UPDATE_REQUEST_ITEM', {
                                idRequest: requestItem.request._id,
                                item: requestItem
                            });
                        }
                        _l.label = 22;
                    case 22:
                        // end update request when check item
                        server_1.io.to("transmittal-list-".concat(team._id)).emit('UPDATE_TRANSMITTAL_ITEM', {
                            transmittalItem: transmittalItemData
                        });
                        _l.label = 23;
                    case 23:
                        if (!(transmittal && (transmittal === null || transmittal === void 0 ? void 0 : transmittal.length))) return [3 /*break*/, 32];
                        return [4 /*yield*/, milestone_model_1["default"].findOne({
                                step: milestone_model_1.ChoicesStepMilestone.finishTransmittal,
                                team: team
                            })];
                    case 24:
                        milestone = _l.sent();
                        requestItems = [];
                        if (!((_a = milestone === null || milestone === void 0 ? void 0 : milestone.updateItems) === null || _a === void 0 ? void 0 : _a.arrivalDate)) return [3 /*break*/, 27];
                        return [4 /*yield*/, transmittalItem_model_1["default"]
                                .updateMany({ transmittal: transmittal }, { $set: { arrivalDate: moment().toDate() } })];
                    case 25:
                        _l.sent();
                        return [4 /*yield*/, requestItem_model_1["default"]
                                .find({ transmittal: transmittal, team: team })
                                .populate(request_controller_1["default"].itemPopulate)
                                .lean()];
                    case 26:
                        requestItems = _l.sent();
                        _l.label = 27;
                    case 27:
                        if (!(milestone && (milestone === null || milestone === void 0 ? void 0 : milestone.requestItemStatus))) return [3 /*break*/, 30];
                        return [4 /*yield*/, requestItem_model_1["default"].updateMany({ transmittal: transmittal }, { $set: { status: milestone.requestItemStatus } })];
                    case 28:
                        _l.sent();
                        return [4 /*yield*/, requestItem_model_1["default"]
                                .find({ transmittal: transmittal, team: team })
                                .populate(request_controller_1["default"].itemPopulate)
                                .lean()];
                    case 29:
                        requestItems = _l.sent();
                        _l.label = 30;
                    case 30: return [4 /*yield*/, transmittal_model_1["default"]
                            .findOneAndUpdate({
                            _id: transmittal
                        }, {
                            $set: {
                                status: transmittal_model_1.ChoicesStatusTransmittal.completed
                            }
                        }, {
                            "new": true
                        })
                            .populate([{
                                path: 'revision',
                                select: ['_id', 'hasDamages']
                            }, {
                                path: 'transporter.carrier',
                                select: ['name']
                            }, {
                                path: 'type',
                                select: ['name']
                            }, {
                                path: 'evidenceFullLoad',
                                select: ['file', 'thumbnail', 'milestone']
                            }, {
                                path: 'transporter.driver',
                                select: ['firstName', 'lastName']
                            }, {
                                path: 'items',
                                select: ['car', 'requestItem', 'destination', 'origin', 'loadingDate', 'arrivalDate', 'observation'],
                                populate: transmittal_controller_1["default"].itemPopulate
                            }, {
                                path: 'files',
                                select: ['file', 'thumbnail']
                            }, {
                                path: 'createdBy',
                                select: ['firstName', 'lastName']
                            }])];
                    case 31:
                        newTransmittal = _l.sent();
                        server_1.io.to("transmittal-list-".concat(team._id)).emit('UPDATE_TRANSMITTAL', {
                            transmittal: newTransmittal
                        });
                        if (requestItems.length) {
                            for (_g = 0, requestItems_1 = requestItems; _g < requestItems_1.length; _g++) {
                                requestItem = requestItems_1[_g];
                                server_1.io.to("request-list-".concat(team._id)).emit('UPDATE_REQUEST_ITEM', {
                                    idRequest: requestItem.request._id,
                                    item: requestItem
                                });
                                server_1.io.to("request-detail-".concat(team._id)).emit('UPDATE_REQUEST_ITEM', {
                                    idRequest: requestItem.request._id,
                                    item: requestItem
                                });
                            }
                        }
                        _l.label = 32;
                    case 32:
                        if (!allImages.length) return [3 /*break*/, 34];
                        return [4 /*yield*/, participantFile_model_1["default"].update({
                                _id: { $in: allImages }
                            }, {
                                participant: newParticipant
                            }, {
                                multi: true
                            })];
                    case 33:
                        _l.sent();
                        _l.label = 34;
                    case 34:
                        if (!car_1) return [3 /*break*/, 38];
                        car_1.lastForm = newParticipant;
                        return [4 /*yield*/, car_1.save()];
                    case 35:
                        _l.sent();
                        // send refresh with websocket to dashboard list
                        server_1.io.to("dashboard-vin-view-".concat(team._id)).emit('REFRESH', {
                            update: true,
                            car: newParticipant._id,
                            notification: {
                                title: 'Vehículo revisado',
                                text: "".concat(req.user.firstName, " ").concat(req.user.lastName, " revis\u00F3 ").concat(car_1.brand, " (").concat(car_1.denomination, ") en ").concat(updatedUser.venue.name, ".")
                            }
                        });
                        // send refresh with websocket to dashboard detail
                        _j = (_h = server_1.io.to("dashboard-vin-detail-".concat(team._id, "-").concat(car_1._id))).emit;
                        _k = ["ADD_PARTICIPANT"];
                        return [4 /*yield*/, participant_model_1["default"]
                                .findById(newParticipant._id, { number: 1, name: 1, user: 1, venue: 1, createdAt: 1, qualification: 1 })
                                .populate([{
                                    path: 'user',
                                    select: ['firstName', 'lastName']
                                }, {
                                    path: 'venue',
                                    select: ['name']
                                }])];
                    case 36:
                        // send refresh with websocket to dashboard detail
                        _j.apply(_h, _k.concat([_l.sent()]));
                        return [4 /*yield*/, new activityHistory_model_1["default"]({
                                team: team,
                                company: company,
                                user: req.user._id,
                                type: activityHistory_model_1.ChoicesTypeActivity.checklist,
                                car: {
                                    _id: car_1._id,
                                    vin: car_1.vin
                                }
                            }).save()];
                    case 37:
                        _l.sent();
                        _l.label = 38;
                    case 38:
                        today = moment().startOf('day');
                        tomorrow = moment(today).add(1, 'days');
                        return [4 /*yield*/, participant_model_1["default"].count({
                                user: req.user,
                                createdAt: {
                                    $gte: today.toDate(),
                                    $lt: tomorrow.toDate()
                                }
                            })];
                    case 39:
                        count = _l.sent();
                        if (!(form.triggers && form.triggers.length)) return [3 /*break*/, 41];
                        triggersHandler = new triggerHandler_1["default"](form, newParticipant);
                        return [4 /*yield*/, triggersHandler.execute({})];
                    case 40:
                        _l.sent();
                        _l.label = 41;
                    case 41: return [4 /*yield*/, alert_model_1["default"]
                            .find({
                            team: team,
                            $or: [
                                { $and: [{ lte: { $gte: formQualification_1 } }, { lte: { $gt: 0 } }] },
                                { $and: [{ gte: { $lte: formQualification_1 } }, { gte: { $gt: 0 } }] }
                            ]
                        }).populate([{
                                path: 'users',
                                select: ['firstName', 'lastName', 'email', 'venue', 'venuesAccess']
                            }])];
                    case 42:
                        alerts = _l.sent();
                        /* Send alerts if exist */
                        if (alerts.length && car_1) {
                            alerts.forEach(function (alert) {
                                alert.users.forEach(function (user) {
                                    var userName = "".concat(user.firstName, " ").concat(user.lastName);
                                    if (user.venuesPermissions(true).includes(venue._id) && user.email && user.email.length) {
                                        app_1.queue.create('email', {
                                            from: '',
                                            title: "Alert qualification",
                                            to: "\"\"<".concat(user.email, ">"),
                                            subject: "ALERTA: ".concat(alert.name),
                                            text: "Hola ".concat(userName, "\n                        Se ha evaluado un VIN con calificaci\u00F3n ").concat(formQualification_1.toFixed(0), "%\n\n                        Datos del Vehiculo\n                        VIN: ").concat(car_1 ? car_1.vin : '', "\n                        MARCA: ").concat(car_1 && car_1.brand ? car_1.brand : '', "\n\n                        Para ver el detalle has click aqu\u00ED\n                        ").concat(process.env.SITE_URL, "cars/").concat(car_1._id, "\n\n                        \u00A9 2021 OSA SpA. Todos los derechos reservados."),
                                            view: 'alerts/lowQualification',
                                            context: {
                                                userName: userName,
                                                brand: car_1 && car_1.brand ? car_1.brand : '',
                                                vin: car_1 && car_1.vin ? car_1.vin : '',
                                                qualification: formQualification_1.toFixed(0),
                                                url: "".concat(process.env.SITE_URL, "cars/").concat(car_1._id)
                                            }
                                        }).priority('high').attempts(5).save();
                                    }
                                });
                            });
                        }
                        return [2 /*return*/, res.json({
                                data: {
                                    id: id,
                                    count: count,
                                    vin: vin,
                                    qualification: formQualification_1
                                },
                                status: 200
                            })];
                    case 43:
                        e_4 = _l.sent();
                        /* istanbul ignore next */
                        console.log(e_4);
                        // return error, if the form could not be recorded
                        /* istanbul ignore next */
                        return [2 /*return*/, res.status(400).json({
                                message: e_4,
                                status: 400
                            })];
                    case 44: return [3 /*break*/, 46];
                    case 45: 
                    // return error, if the form could not find
                    return [2 /*return*/, res.status(400).json({
                            message: 'No se ha encontrado el formularío',
                            status: 400
                        })];
                    case 46: return [3 /*break*/, 48];
                    case 47: return [2 /*return*/, res.status(400).json({
                            message: 'VIN no encontrado.',
                            status: 400
                        })];
                    case 48: return [3 /*break*/, 50];
                    case 49:
                        e_5 = _l.sent();
                        Raven.captureException(e_5, { req: req });
                        /* istanbul ignore next */
                        console.log(e_5);
                        console.log(e_5.stack);
                        /* istanbul ignore next */
                        return [2 /*return*/, res.status(400).json({
                                message: e_5,
                                status: 400
                            })];
                    case 50: return [2 /*return*/];
                }
            });
        });
    };
    FormController.prototype.uploadFile = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var id, company, file, participantFile_1, e_6;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        id = req.params.id;
                        company = req.user.company;
                        file = general_utils_1["default"].getFileFromRequest(req.files, 'file');
                        logger_service_1["default"].info("uploadFile");
                        logger_service_1["default"].info("{user: {_id: ".concat(req.user._id, ", email: ").concat(req.user.email, "}, {form: ").concat(id, ", file: ").concat(JSON.stringify(file), "}}"));
                        if (!file) return [3 /*break*/, 6];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        participantFile_1 = new participantFile_model_1["default"]();
                        if (!new RegExp('\\bimage\\b').test(file.mimetype)) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.autoRotate(file.path)];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3:
                        file.headers = {
                            'Content-Type': file.mimetype
                        };
                        file.company = company._id;
                        file.form = id;
                        participantFile_1.user = req.user._id;
                        participantFile_1.company = company._id;
                        participantFile_1.attach('file', file, function (error) { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        if (!error) return [3 /*break*/, 1];
                                        /* istanbul ignore next */
                                        res.status(400).json(error);
                                        return [3 /*break*/, 3];
                                    case 1: return [4 /*yield*/, participantFile_1.save()];
                                    case 2:
                                        _a.sent();
                                        res.status(201).json({
                                            data: {
                                                _id: participantFile_1._id,
                                                file: participantFile_1.file
                                            },
                                            status: 201
                                        });
                                        _a.label = 3;
                                    case 3: return [2 /*return*/];
                                }
                            });
                        }); });
                        return [3 /*break*/, 5];
                    case 4:
                        e_6 = _a.sent();
                        Raven.captureException(e_6, { req: req });
                        /* istanbul ignore next */
                        logger_service_1["default"].error("async error:");
                        /* istanbul ignore next */
                        logger_service_1["default"].error(e_6);
                        /* istanbul ignore next */
                        res.status(400).json(e_6);
                        return [3 /*break*/, 5];
                    case 5: return [3 /*break*/, 7];
                    case 6:
                        logger_service_1["default"].error("uploadFile: La imagen es obligatoria.");
                        res.status(400).json({
                            message: 'La imagen es obligatoria.',
                            status: 400
                        });
                        _a.label = 7;
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    FormController.prototype.changePreferred = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var form, team, user, e_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        form = req.body.form;
                        team = req.user.team._id;
                        logger_service_1["default"].info("changePreferred");
                        logger_service_1["default"].info("{user: {_id: ".concat(req.user._id, ", email: ").concat(req.user.email, "}, body: ").concat(JSON.stringify(req.body), "}"));
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 9, , 10]);
                        return [4 /*yield*/, user_model_2["default"].findOne({ _id: req.user._id, team: team, active: true })];
                    case 2:
                        user = _a.sent();
                        if (!user) return [3 /*break*/, 7];
                        return [4 /*yield*/, form_model_1["default"].findOne({ _id: form, team: team })];
                    case 3:
                        form = _a.sent();
                        if (!form) return [3 /*break*/, 5];
                        user.preferred = form;
                        return [4 /*yield*/, user.save()];
                    case 4:
                        _a.sent();
                        res.status(200).json({
                            message: 'Se ha actualizado',
                            status: 200
                        });
                        return [3 /*break*/, 6];
                    case 5:
                        logger_service_1["default"].error("changePreferred: Formulario no encontrado");
                        logger_service_1["default"].error("{user: {_id: ".concat(req.user._id, ", email: ").concat(req.user.email, "}}"));
                        res.status(400).json({
                            message: 'Formulario no encontrado',
                            status: 400
                        });
                        _a.label = 6;
                    case 6: return [3 /*break*/, 8];
                    case 7:
                        logger_service_1["default"].error("changePreferred: Usuario no encontrado");
                        logger_service_1["default"].error("{user: {_id: ".concat(req.user._id, ", email: ").concat(req.user.email, "}}"));
                        res.status(400).json({
                            message: 'Usuario no encontrado',
                            status: 400
                        });
                        _a.label = 8;
                    case 8: return [3 /*break*/, 10];
                    case 9:
                        e_7 = _a.sent();
                        Raven.captureException(e_7, { req: req });
                        /* istanbul ignore next */
                        logger_service_1["default"].error("changePreferred: Async Error.");
                        /* istanbul ignore next */
                        logger_service_1["default"].error("{user: {_id: ".concat(req.user._id, ", email: ").concat(req.user.email, "}}"));
                        /* istanbul ignore next */
                        logger_service_1["default"].error(e_7);
                        res.status(400).json({
                            message: 'Ha ocurrido un error',
                            status: 400
                        });
                        return [3 /*break*/, 10];
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    FormController.prototype.damagesDashboard = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var team, damaged, undamaged, allVenues_1, venuesPermissions, venues_1, damagesData_1, data, e_8;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        team = req.user.team._id;
                        return [4 /*yield*/, participant_model_1["default"].aggregate([{
                                    $match: {
                                        team: team,
                                        'venue': {
                                            $in: req.user.venuesPermissions()
                                        },
                                        'sections.answers.kind': 'damage',
                                        'sections.answers.damagesSelected._id': { $exists: true }
                                    }
                                }, {
                                    $group: {
                                        _id: {
                                            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
                                        },
                                        count: { $sum: 1 }
                                    }
                                }])];
                    case 1:
                        damaged = _a.sent();
                        return [4 /*yield*/, participant_model_1["default"].aggregate([{
                                    $match: {
                                        team: team,
                                        'venue': {
                                            $in: req.user.venuesPermissions()
                                        },
                                        'sections.answers.kind': 'damage',
                                        'sections.answers.damagesSelected._id': { $exists: false }
                                    }
                                }, {
                                    $group: {
                                        _id: {
                                            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
                                        },
                                        count: { $sum: 1 }
                                    }
                                }])];
                    case 2:
                        undamaged = _a.sent();
                        allVenues_1 = [];
                        if (damaged) {
                            damaged.forEach(function (item) {
                                if (item._id.venue && !allVenues_1.includes(item._id.venue.toString())) {
                                    allVenues_1.push(item._id.venue.toString());
                                }
                            });
                        }
                        undamaged.forEach(function (item) {
                            if (item._id.venue && !allVenues_1.includes(item._id.venue.toString())) {
                                allVenues_1.push(item._id.venue.toString());
                            }
                        });
                        venuesPermissions = req.user.venuesPermissions(true);
                        venues_1 = [];
                        venuesPermissions.forEach(function (v) {
                            if (allVenues_1.includes(v) && !venues_1.includes(v)) {
                                venues_1.push(v);
                            }
                        });
                        damagesData_1 = {};
                        venues_1.forEach(function (venue) { return damagesData_1[venue] = { damaged: 0, undamaged: 0 }; });
                        damaged.forEach(function (item) {
                            if (item._id.venue in damagesData_1) {
                                damagesData_1[item._id.venue].damaged = item.count;
                            }
                        });
                        undamaged.forEach(function (item) {
                            if (item._id.venue in damagesData_1) {
                                damagesData_1[item._id.venue].undamaged = item.count;
                            }
                        });
                        data = {
                            damaged: venues_1.map(function (v) { return damagesData_1[v].damaged; }),
                            undamaged: venues_1.map(function (v) { return damagesData_1[v].undamaged; }),
                            venues: venues_1
                        };
                        res.json(data);
                        return [3 /*break*/, 4];
                    case 3:
                        e_8 = _a.sent();
                        Raven.captureException(e_8, { req: req });
                        /* istanbul ignore next */
                        logger_service_1["default"].error("dashboard damages: Async Error.");
                        /* istanbul ignore next */
                        logger_service_1["default"].error("{user: {_id: ".concat(req.user._id, ", email: ").concat(req.user.email, "}}"));
                        /* istanbul ignore next */
                        logger_service_1["default"].error(e_8);
                        res.status(400).json({
                            message: 'Ha ocurrido un error',
                            status: 400
                        });
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    FormController.prototype.participantWithDamages = function (participant) {
        return new Promise(function (resolve) {
            participant.hasDamages = participant.sections.some(function (section) {
                return section.answers.some(function (answer) {
                    return answer.damagesSelected.length > 0;
                });
            });
            resolve(participant);
        });
    };
    FormController.prototype.damagesDashboardPerDay = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var days, participants, data, i, key, promises, _i, participants_1, participant, participantsWithDamages, _a, _b, participantsWithDamages_1, participant, venueId, dayKey, e_9;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 5, , 6]);
                        days = 15;
                        moment.locale('es');
                        moment.tz.setDefault('America/Santiago');
                        return [4 /*yield*/, participant_model_1["default"].find({
                                venue: {
                                    $in: req.user.venuesPermissions()
                                },
                                createdAt: {
                                    $gte: moment().endOf('day').subtract(days, 'd').toDate()
                                },
                                kind: { $ne: form_model_1.KindForm.transmittal }
                            }, {
                                _id: true,
                                venue: true,
                                // user: true,
                                createdAt: true,
                                'sections.answers.damagesSelected': true
                            }).populate([{
                                    path: 'venue',
                                    select: ['_id', 'name']
                                } /*,{
                                  path: 'user',
                                  select: ['_id', 'email']
                                }*/
                            ]).lean()];
                    case 1:
                        participants = _c.sent();
                        data = {};
                        for (i = 0; i < days; i++) {
                            key = moment()
                                .subtract(i, 'days')
                                .startOf('day')
                                .format('YYYY-MM-DD');
                            data[key] = {
                                damaged: 0,
                                undamaged: 0
                            };
                        }
                        promises = [];
                        for (_i = 0, participants_1 = participants; _i < participants_1.length; _i++) {
                            participant = participants_1[_i];
                            promises.push(this.participantWithDamages(participant));
                        }
                        participantsWithDamages = [];
                        _c.label = 2;
                    case 2:
                        if (!promises.length) return [3 /*break*/, 4];
                        _a = [__spreadArray([], participantsWithDamages, true)];
                        return [4 /*yield*/, bluebird.all(promises.splice(0, 500))];
                    case 3:
                        participantsWithDamages = __spreadArray.apply(void 0, _a.concat([_c.sent(), true]));
                        return [3 /*break*/, 2];
                    case 4:
                        for (_b = 0, participantsWithDamages_1 = participantsWithDamages; _b < participantsWithDamages_1.length; _b++) {
                            participant = participantsWithDamages_1[_b];
                            venueId = participant.venue._id.toString();
                            dayKey = moment(participant.createdAt).format('YYYY-MM-DD');
                            if (!data.hasOwnProperty(dayKey)) {
                                data[dayKey] = {
                                    damaged: 0,
                                    undamaged: 0
                                };
                            }
                            if (!data[dayKey].hasOwnProperty(venueId)) {
                                data[dayKey][venueId] = {
                                    name: participant.venue.name,
                                    damaged: 0,
                                    undamaged: 0
                                };
                            }
                            // if (!data[dayKey][venueId].hasOwnProperty(userId)) {
                            //   data[dayKey][venueId][userId] = {
                            //     email: participant.user.email,
                            //     damaged: 0,
                            //     undamaged: 0
                            //   };
                            // }
                            data[dayKey][participant.hasDamages ? 'damaged' : 'undamaged']++;
                            data[dayKey][venueId][participant.hasDamages ? 'damaged' : 'undamaged']++;
                            // data[dayKey][venueId][userId][participant.hasDamages ? 'damaged' : 'undamaged']++;
                        }
                        res.json(data);
                        return [3 /*break*/, 6];
                    case 5:
                        e_9 = _c.sent();
                        Raven.captureException(e_9, { req: req });
                        /* istanbul ignore next */
                        logger_service_1["default"].error("dashboard damages: Async Error.");
                        /* istanbul ignore next */
                        logger_service_1["default"].error("{user: {_id: ".concat(req.user._id, ", email: ").concat(req.user.email, "}}"));
                        /* istanbul ignore next */
                        logger_service_1["default"].error(e_9);
                        res.status(400).json({
                            message: 'Ha ocurrido un error',
                            status: 400
                        });
                        return [3 /*break*/, 6];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    FormController.prototype.timingDerco = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var team, userObject, total, threshold, reception, cars, carsDict, _i, cars_1, car, receptions, i, aux, workbook, worksheet, _a, receptions_1, reception_1, carID, car, t0, t1, hour, dm, ontime, tempFilePath, e_10;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 10, , 11]);
                        team = req.user.team._id;
                        return [4 /*yield*/, user_model_1["default"].findOne({ _id: req.user._id })];
                    case 1:
                        userObject = _b.sent();
                        if (!(userObject && userObject.team.toString() === '5bf2de34caf8ef7096105cda')) return [3 /*break*/, 9];
                        total = 2;
                        threshold = 60 * 24 * 3;
                        return [4 /*yield*/, form_model_1["default"].findOne({ _id: '5b0487db835536612bab1b61' })];
                    case 2:
                        reception = _b.sent();
                        return [4 /*yield*/, car_model_1["default"].find({
                                team: team,
                                lastForm: { $ne: null }
                            })];
                    case 3:
                        cars = _b.sent();
                        carsDict = {};
                        for (_i = 0, cars_1 = cars; _i < cars_1.length; _i++) {
                            car = cars_1[_i];
                            carsDict[car._id.toString()] = car;
                        }
                        receptions = [];
                        i = 0;
                        _b.label = 4;
                    case 4:
                        if (!(i < total)) return [3 /*break*/, 7];
                        return [4 /*yield*/, participant_model_1["default"].find({
                                team: team,
                                form: reception._id,
                                createdAt: {
                                    $gt: moment().subtract((i + 1) * 30, 'days').toDate(),
                                    $lt: moment().subtract(i * 30, 'days').toDate()
                                }
                            }, ['car', 'createdAt'], {
                                sort: {
                                    createdAt: -1
                                }
                            })];
                    case 5:
                        aux = _b.sent();
                        receptions = receptions.concat(aux);
                        _b.label = 6;
                    case 6:
                        i++;
                        return [3 /*break*/, 4];
                    case 7:
                        workbook = new excel.Workbook();
                        worksheet = workbook.addWorksheet('Revisiones', {
                            properties: {
                                defaultRowHeight: 30
                            }, pageSetup: {
                                fitToPage: true, fitToHeight: 100, fitToWidth: 1
                            }
                        });
                        worksheet.columns = [{
                                header: 'VIN', key: 'vin', width: 30
                            }, {
                                header: 'Marca', key: 'brand', width: 30
                            }, {
                                header: 'Fecha carga', key: 'createdAt', width: 30
                            }, {
                                header: 'Mes carga', key: 'createdAtMonth', width: 30
                            }, {
                                header: 'Fecha revisión', key: 'checkedAt', width: 30
                            }, {
                                header: 'Mes revisión', key: 'checkedAtMonth', width: 30
                            }, {
                                header: 'Delta tiempo', key: 'leadtime', width: 20
                            }, {
                                header: 'On time', key: 'ontime', width: 20
                            }
                        ];
                        for (_a = 0, receptions_1 = receptions; _a < receptions_1.length; _a++) {
                            reception_1 = receptions_1[_a];
                            carID = reception_1.car.toString();
                            if (carID in carsDict) {
                                car = carsDict[carID];
                                t0 = moment(car.createdAt).subtract(4, 'hours');
                                t1 = moment(reception_1.createdAt).subtract(4, 'hours');
                                hour = parseInt(t0.format('HH'), 10);
                                if (hour >= 20 || hour <= 2)
                                    continue;
                                dm = t1.diff(t0, 'minutes');
                                if (dm > 10) {
                                    ontime = dm < threshold ? 1 : 0;
                                    worksheet.addRow({
                                        vin: car.vin,
                                        brand: car.brand,
                                        createdAt: t0.format('YYYY-MM-DD HH:mm:ss'),
                                        createdAtMonth: t0.format('MM'),
                                        checkedAt: t1.format('YYYY-MM-DD HH:mm:ss'),
                                        checkedAtMonth: t1.format('MM'),
                                        leadtime: dm,
                                        ontime: ontime
                                    });
                                }
                            }
                        }
                        tempFilePath = tempfile('.xlsx');
                        return [4 /*yield*/, workbook.xlsx.writeFile(tempFilePath)];
                    case 8:
                        _b.sent();
                        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                        res.setHeader('Content-Disposition', 'attachment; filename=revisiones-03-07-2019.xlsx');
                        return [2 /*return*/, res.sendFile(tempFilePath)];
                    case 9: return [3 /*break*/, 11];
                    case 10:
                        e_10 = _b.sent();
                        Raven.captureException(e_10, { req: req });
                        /* istanbul ignore next */
                        logger_service_1["default"].error("dashboard timing derco: Async Error.");
                        /* istanbul ignore next */
                        logger_service_1["default"].error("{user: {_id: ".concat(req.user._id, ", email: ").concat(req.user.email, "}}"));
                        /* istanbul ignore next */
                        logger_service_1["default"].error(e_10);
                        res.status(400).json({
                            message: 'Ha ocurrido un error',
                            status: 400
                        });
                        return [3 /*break*/, 11];
                    case 11: return [2 /*return*/];
                }
            });
        });
    };
    FormController.getDercoDeliveryParticipants = function (team, from, to) {
        return __awaiter(this, void 0, void 0, function () {
            var receptionForm;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, form_model_1["default"].findOne({ _id: '5b1ae5799ebea419025b3e41' })];
                    case 1:
                        receptionForm = _a.sent();
                        return [2 /*return*/, participant_model_1["default"].aggregate([
                                {
                                    $match: {
                                        team: team,
                                        form: receptionForm._id,
                                        createdAt: {
                                            $gte: from,
                                            $lte: to
                                        }
                                    }
                                },
                                {
                                    $project: {
                                        car: 1,
                                        venue: 1,
                                        receiveFrom: 1,
                                        form: 1,
                                        createdAt: 1
                                    }
                                },
                                {
                                    $lookup: {
                                        from: 'cars',
                                        localField: 'car',
                                        foreignField: '_id',
                                        as: 'related_car'
                                    }
                                },
                                { $unwind: '$related_car' },
                                {
                                    $match: {
                                        'related_car.team': team,
                                        'related_car.lastForm': { $ne: null },
                                        'related_car.createdAt': {
                                            $gte: from,
                                            $lte: to
                                        }
                                    }
                                },
                                {
                                    $lookup: {
                                        from: 'venues',
                                        localField: 'venue',
                                        foreignField: '_id',
                                        as: 'to'
                                    }
                                },
                                { $unwind: '$to' }
                            ])];
                }
            });
        });
    };
    FormController.prototype.getDeliveryParticipants = function (team, from, to) {
        return __awaiter(this, void 0, void 0, function () {
            var distributors, receivers, receptions;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, venue_model_1["default"].find({ team: team, type: 'distributor' })];
                    case 1:
                        distributors = _a.sent();
                        return [4 /*yield*/, venue_model_1["default"].find({ team: team, type: 'receiver' })];
                    case 2:
                        receivers = _a.sent();
                        return [4 /*yield*/, participant_model_1["default"].aggregate([
                                {
                                    $lookup: {
                                        from: 'participants',
                                        localField: 'car',
                                        foreignField: 'car',
                                        as: 'recived_participants'
                                    }
                                },
                                {
                                    $unwind: '$recived_participants'
                                },
                                {
                                    $match: {
                                        team: team,
                                        venue: { $in: receivers.map(function (v) { return v._id; }) },
                                        receiveFrom: { $in: distributors.map(function (v) { return v._id; }) },
                                        reception: true,
                                        createdAt: {
                                            $gte: from,
                                            $lte: to
                                        },
                                        'recived_participants.venue': { $in: distributors.map(function (v) { return v._id; }) },
                                        'recived_participants.reception': false,
                                        'recived_participants.createdAt': {
                                            $gte: from,
                                            $lte: to
                                        }
                                    }
                                },
                                {
                                    $project: {
                                        car: 1,
                                        venue: 1,
                                        createdAt: 1,
                                        'recived_participants.createdAt': 1,
                                        'recived_participants.car': 1,
                                        'recived_participants.team': 1,
                                        'recived_participants.venue': 1,
                                        'recived_participants._id': 1
                                    }
                                },
                                {
                                    $sort: { 'recived_participants.createdAt': -1 }
                                },
                                {
                                    $lookup: {
                                        from: 'venues',
                                        localField: 'venue',
                                        foreignField: '_id',
                                        as: 'venue'
                                    }
                                },
                                { $unwind: '$venue' },
                                {
                                    $lookup: {
                                        from: 'venues',
                                        localField: 'recived_participants.venue',
                                        foreignField: '_id',
                                        as: 'recived_participants.venue'
                                    }
                                },
                                { $unwind: '$recived_participants.venue' },
                                {
                                    $group: {
                                        _id: '$_id',
                                        car: { $first: '$car' },
                                        venue: { $first: '$venue' },
                                        createdAt: { $first: '$createdAt' },
                                        recived_participants: { $push: '$recived_participants' }
                                    }
                                },
                                {
                                    $project: {
                                        car: 1,
                                        venue: 1,
                                        createdAt: 1,
                                        'recived_participants': { '$arrayElemAt': ['$recived_participants', 0] }
                                    }
                                }
                            ])];
                    case 3:
                        receptions = _a.sent();
                        return [2 /*return*/, receptions.filter(function (reception, index) {
                                return index === receptions.findIndex(function (obj) {
                                    return obj.recived_participants._id.toString() === reception.recived_participants._id.toString();
                                });
                            })];
                }
            });
        });
    };
    FormController.isDercoUser = function (user) {
        return user && user.team.toString() === DERCO_TEAM;
    };
    FormController.parseReception = function (reception, distributorTable) {
        var recivedparticipant = reception.recived_participants;
        var sendingVenue = recivedparticipant.venue;
        var daysLimit = distributorTable[sendingVenue._id.toString()] &&
            distributorTable[sendingVenue._id.toString()][reception.venue._id.toString()] ?
            distributorTable[sendingVenue._id.toString()][reception.venue._id.toString()] :
            5;
        var threshold = daysLimit * 60 * 24;
        var t0 = moment(recivedparticipant.createdAt);
        var t1 = moment(reception.createdAt);
        var dm = t1.diff(t0, 'minutes');
        return {
            date_send: t0,
            date_recived: t1,
            reception_id: reception._id,
            send_id: recivedparticipant._id,
            from: sendingVenue.abbreviation || sendingVenue.name,
            to: reception.venue.abbreviation || reception.venue.name,
            atTime: dm <= threshold,
            daysLimit: daysLimit
        };
    };
    FormController.parseDercoReception = function (reception, distributorTable, dercoDistributionVenue) {
        var car = reception.related_car;
        // TODO: Get The real origin Venue
        var sendingVenue = dercoDistributionVenue;
        var venue = reception.to;
        var daysLimit = distributorTable[sendingVenue._id.toString()] &&
            distributorTable[sendingVenue._id.toString()][venue._id.toString()] ?
            distributorTable[sendingVenue._id.toString()][venue._id.toString()] :
            5;
        var threshold = daysLimit * 60 * 24;
        var t0 = moment(car.createdAt);
        var t1 = moment(reception.createdAt);
        var dm = t1.diff(t0, 'minutes');
        return {
            date_send: t0,
            date_recived: t1,
            reception_id: reception._id,
            from: sendingVenue.abbreviation || sendingVenue.name,
            to: venue.abbreviation || venue.name,
            atTime: dm <= threshold,
            daysLimit: daysLimit
        };
    };
    FormController.prototype.timingDashboard = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var team, userObject, distributors_1, start, to, startDate, toDate, distributorTable_1, data, i, month, isDercoUser, receptions, _a, _i, receptions_2, reception, value, month, e_11;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 7, , 8]);
                        team = req.user.team;
                        return [4 /*yield*/, user_model_1["default"].findOne({ _id: req.user._id })];
                    case 1:
                        userObject = _b.sent();
                        return [4 /*yield*/, venue_model_1["default"].find({ team: team, type: 'distributor' }, {}).populate({
                                path: 'sendToDays.venue',
                                select: ['_id']
                            })];
                    case 2:
                        distributors_1 = _b.sent();
                        start = req.query.start;
                        to = req.query.end;
                        startDate = start && start !== '' ? moment(start, 'YYYY-MM-DD') :
                            moment().subtract(3, 'months').startOf('month').startOf('day');
                        toDate = to && to !== '' ? moment(to, 'YYYY-MM-DD') :
                            moment().endOf('month').endOf('day');
                        distributorTable_1 = {};
                        distributors_1.map(function (distributor) {
                            var distributorId = distributor._id.toString();
                            if (!(distributorId in distributors_1))
                                distributorTable_1[distributorId] = {};
                            distributor.sendToDays.map(function (venueDay) {
                                var venueId = venueDay.venue._id.toString();
                                distributorTable_1[distributorId][venueId] = venueDay.shippingMaxDays;
                            });
                        });
                        data = {};
                        for (i = startDate; i <= toDate; i = i.add(1, 'month')) {
                            month = i.format('MM-YYYY');
                            data[month] = [];
                        }
                        startDate = start && start !== '' ? moment(start, 'YYYY-MM-DD') :
                            moment().subtract(3, 'months').startOf('month').startOf('day');
                        isDercoUser = FormController.isDercoUser(userObject);
                        if (!isDercoUser) return [3 /*break*/, 4];
                        return [4 /*yield*/, FormController.getDercoDeliveryParticipants(team, startDate.toDate(), toDate.toDate())];
                    case 3:
                        _a = _b.sent();
                        return [3 /*break*/, 6];
                    case 4: return [4 /*yield*/, this.getDeliveryParticipants(team, startDate.toDate(), toDate.toDate())];
                    case 5:
                        _a = _b.sent();
                        _b.label = 6;
                    case 6:
                        receptions = _a;
                        for (_i = 0, receptions_2 = receptions; _i < receptions_2.length; _i++) {
                            reception = receptions_2[_i];
                            value = isDercoUser ? FormController.parseDercoReception(reception, distributorTable_1, distributors_1[0]) :
                                FormController.parseReception(reception, distributorTable_1);
                            month = value.date_send.format('MM-YYYY');
                            data[month].push(value);
                        }
                        return [2 /*return*/, res.json(data)];
                    case 7:
                        e_11 = _b.sent();
                        Raven.captureException(e_11, { req: req });
                        /* istanbul ignore next */
                        logger_service_1["default"].error("dashboard timing: Async Error.");
                        /* istanbul ignore next */
                        logger_service_1["default"].error("{user: {_id: ".concat(req.user._id, ", email: ").concat(req.user.email, "}}"));
                        /* istanbul ignore next */
                        logger_service_1["default"].error(e_11);
                        res.status(400).json({
                            message: 'Ha ocurrido un error',
                            status: 400
                        });
                        return [3 /*break*/, 8];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    FormController.prototype.apiRevisionsGapExport = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var workbook, worksheet, team, periods, _loop_2, i, state_1, e_12;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!req.user.hasPermission('exportRevisionsGap')) {
                            return [2 /*return*/, res.status(403).json({
                                    message: 'No tienes permisos para esta operación'
                                })];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 6, , 7]);
                        workbook = new excel.Workbook();
                        worksheet = workbook.addWorksheet('Daños', {
                            properties: {
                                defaultRowHeight: 30
                            }, pageSetup: {
                                fitToPage: true, fitToHeight: 100, fitToWidth: 1
                            }
                        });
                        worksheet.autoFilter = { from: 'A1', to: 'F1' };
                        worksheet.columns = [{
                                header: 'VIN', key: 'vin', width: 30
                            }, {
                                header: 'Marca', key: 'brand', width: 30
                            }, {
                                header: 'Total revisiones', key: 'participants', width: 30
                            }, {
                                header: 'Fecha despacho', key: 'p0CreatedAt', width: 30
                            }, {
                                header: 'Sucursal despacho', key: 'p0Venue', width: 30
                            }, {
                                header: 'Calificación despacho', key: 'p0Qualification', width: 30
                            }, {
                                header: 'Gas despacho', key: 'p0Gas', width: 30
                            }, {
                                header: 'Pintura despacho', key: 'p0Paint', width: 30
                            }, {
                                header: 'Lata despacho', key: 'p0SheetMetal', width: 30
                            }, {
                                header: 'Fecha recepción', key: 'p1CreatedAt', width: 30
                            }, {
                                header: 'Sucursal recepción', key: 'p1Venue', width: 30
                            }, {
                                header: 'Calificación recepción', key: 'p1Qualification', width: 30
                            }, {
                                header: 'Gas recepción', key: 'p1Gas', width: 30
                            }, {
                                header: 'Pintura recepción', key: 'p1Paint', width: 30
                            }, {
                                header: 'Lata recepción', key: 'p1SheetMetal', width: 30
                            }];
                        team = req.user.team._id;
                        periods = 6;
                        _loop_2 = function (i) {
                            var t0, t1, cars, f0, f1, gasQuestion, paintQuestion, sheetMetalQuestion, _loop_3, _i, cars_2, car, tempFilePath;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        t0 = moment().subtract(i + 1, 'months');
                                        t1 = moment().subtract(i, 'months');
                                        return [4 /*yield*/, car_model_1["default"].find({
                                                team: team,
                                                lastForm: { $exists: true },
                                                createdAt: {
                                                    $gte: t0,
                                                    $lte: t1
                                                }
                                            }).populate({
                                                path: 'participants',
                                                populate: {
                                                    path: 'venue',
                                                    model: 'Venue'
                                                }
                                            })];
                                    case 1:
                                        cars = _b.sent();
                                        f0 = '5b0487db835536612bab1b61';
                                        f1 = '5b1ae5799ebea419025b3e41';
                                        gasQuestion = '5b64b543cee543c2afda41bd';
                                        paintQuestion = '5b64b1f6cc5e14f59724f8d1';
                                        sheetMetalQuestion = '5b64b22245f69e40fc5713fb';
                                        _loop_3 = function (car) {
                                            if (car.participants.length > 0) {
                                                var participants = car.participants.sort(function (p0, p1) { return p0.createdAt >= p1.createdAt ? 1 : 0; });
                                                var p0 = null;
                                                var p1 = null;
                                                // only one form
                                                if (participants.length < 2) {
                                                    if (participants[0].form.toString() == f0)
                                                        p0 = participants[0];
                                                    else if (participants[0].form.toString() == f1)
                                                        p1 = participants[0];
                                                }
                                                else {
                                                    var length = participants.length;
                                                    p0 = participants[0];
                                                    p1 = participants[length - 1];
                                                }
                                                var choice0Gas = null;
                                                var choice1Gas = null;
                                                if (p0) {
                                                    var answer0Gas_1 = p0.sections.map(function (s) { return s.answers; }).reduce(function (x, y) { return __spreadArray(__spreadArray([], x, true), y, true); }, []).find(function (a) { return a._id.toString() == gasQuestion; });
                                                    if (answer0Gas_1)
                                                        choice0Gas = answer0Gas_1.scale.choices.find(function (c) { return c._id.toString() == answer0Gas_1.answer.toString(); });
                                                }
                                                if (p1) {
                                                    var answer1Gas_1 = p1.sections.map(function (s) { return s.answers; }).reduce(function (x, y) { return __spreadArray(__spreadArray([], x, true), y, true); }, []).find(function (a) { return a._id.toString() == gasQuestion; });
                                                    if (answer1Gas_1)
                                                        choice1Gas = answer1Gas_1.scale.choices.find(function (c) { return c._id.toString() == answer1Gas_1.answer.toString(); });
                                                }
                                                var choice0Paint = null;
                                                var choice1Paint = null;
                                                if (p0) {
                                                    var answer0Paint_1 = p0.sections.map(function (s) { return s.answers; }).reduce(function (x, y) { return __spreadArray(__spreadArray([], x, true), y, true); }, []).find(function (a) { return a._id.toString() == paintQuestion; });
                                                    if (answer0Paint_1)
                                                        choice0Paint = answer0Paint_1.scale.choices.find(function (c) { return c._id.toString() == answer0Paint_1.answer.toString(); });
                                                }
                                                if (p1) {
                                                    var answer1Paint_1 = p1.sections.map(function (s) { return s.answers; }).reduce(function (x, y) { return __spreadArray(__spreadArray([], x, true), y, true); }, []).find(function (a) { return a._id.toString() == paintQuestion; });
                                                    if (answer1Paint_1)
                                                        choice1Paint = answer1Paint_1.scale.choices.find(function (c) { return c._id.toString() == answer1Paint_1.answer.toString(); });
                                                }
                                                // lata
                                                var choice0SheetMetal = null;
                                                var choice1SheetMetal = null;
                                                if (p0) {
                                                    var answer0SheetMetal_1 = p0.sections.map(function (s) { return s.answers; }).reduce(function (x, y) { return __spreadArray(__spreadArray([], x, true), y, true); }, []).find(function (a) { return a._id.toString() == sheetMetalQuestion; });
                                                    if (answer0SheetMetal_1)
                                                        choice0SheetMetal = answer0SheetMetal_1.scale.choices.find(function (c) { return c._id.toString() == answer0SheetMetal_1.answer.toString(); });
                                                }
                                                if (p1) {
                                                    var answer1SheetMetal_1 = p1.sections.map(function (s) { return s.answers; }).reduce(function (x, y) { return __spreadArray(__spreadArray([], x, true), y, true); }, []).find(function (a) { return a._id.toString() == sheetMetalQuestion; });
                                                    if (answer1SheetMetal_1)
                                                        choice1SheetMetal = answer1SheetMetal_1.scale.choices.find(function (c) { return c._id.toString() == answer1SheetMetal_1.answer.toString(); });
                                                }
                                                var row = {
                                                    vin: car.vin,
                                                    brand: car.brand,
                                                    p0CreatedAt: p0 ? p0.createdAt : '-',
                                                    p0Venue: p0 ? p0.venue.name : '-',
                                                    p0Qualification: p0 ? p0.qualification : '-',
                                                    p0Gas: choice0Gas ? choice0Gas.choice : '-',
                                                    p0Paint: choice0Paint ? choice0Paint.choice : '-',
                                                    p0SheetMetal: choice0SheetMetal ? choice0SheetMetal.choice : '-',
                                                    p1CreatedAt: p1 ? p1.createdAt : '-',
                                                    p1Venue: p1 ? p1.venue.name : '-',
                                                    p1Qualification: p1 ? p1.qualification : '-',
                                                    p1Gas: choice1Gas ? choice1Gas.choice : '-',
                                                    p1Paint: choice1Paint ? choice1Paint.choice : '-',
                                                    p1SheetMetal: choice1SheetMetal ? choice1SheetMetal.choice : '-'
                                                };
                                                worksheet.addRow(row);
                                            }
                                        };
                                        for (_i = 0, cars_2 = cars; _i < cars_2.length; _i++) {
                                            car = cars_2[_i];
                                            _loop_3(car);
                                        }
                                        /* formats */
                                        worksheet.getRow(1).eachCell(function (cell) {
                                            cell.font = {
                                                bold: true
                                            };
                                        });
                                        tempFilePath = tempfile('.xlsx');
                                        return [4 /*yield*/, workbook.xlsx.writeFile(tempFilePath)];
                                    case 2:
                                        _b.sent();
                                        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                                        res.setHeader('Content-Disposition', "attachment; filename=revisiones-".concat(moment().format('YYYY-MM-DD'), ".xlsx"));
                                        return [2 /*return*/, { value: res.sendFile(tempFilePath) }];
                                }
                            });
                        };
                        i = 0;
                        _a.label = 2;
                    case 2:
                        if (!(i < periods)) return [3 /*break*/, 5];
                        return [5 /*yield**/, _loop_2(i)];
                    case 3:
                        state_1 = _a.sent();
                        if (typeof state_1 === "object")
                            return [2 /*return*/, state_1.value];
                        _a.label = 4;
                    case 4:
                        i++;
                        return [3 /*break*/, 2];
                    case 5: return [3 /*break*/, 7];
                    case 6:
                        e_12 = _a.sent();
                        Raven.captureException(e_12, { req: req });
                        /* istanbul ignore next */
                        logger_service_1["default"].error("dashboard revisiones: Async Error.");
                        /* istanbul ignore next */
                        logger_service_1["default"].error("{user: {_id: ".concat(req.user._id, ", email: ").concat(req.user.email, "}}"));
                        /* istanbul ignore next */
                        logger_service_1["default"].error(e_12);
                        res.status(400).json({
                            message: 'Ha ocurrido un error',
                            status: 400
                        });
                        return [3 /*break*/, 7];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    FormController.prototype.cleaningDashboard = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var team, form, answer, days, daysDict_1, total, t0, i, day, cleanDispatch, _i, cleanDispatch_1, datum, day, sum, notCleanDispatch, _a, notCleanDispatch_1, datum, day, sum, e_13;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 5, , 6]);
                        team = req.user.team._id;
                        return [4 /*yield*/, form_model_1["default"].findById('5b0487db835536612bab1b61')];
                    case 1:
                        form = _b.sent();
                        answer = new bson_1.ObjectID('5b64b2e8de5557c85fa14fa0');
                        days = [];
                        daysDict_1 = {};
                        if (!form) return [3 /*break*/, 4];
                        total = 30 * 6;
                        t0 = moment().subtract(total, 'days');
                        for (i = 0; i < total; i++) {
                            day = moment().subtract(total - i, 'days').format('YYYY-MM-DD');
                            daysDict_1[day] = {
                                'clean': 0,
                                'notClean': 0
                            };
                            days.push(day);
                        }
                        return [4 /*yield*/, participant_model_1["default"].aggregate([
                                {
                                    $match: {
                                        team: team,
                                        form: form._id,
                                        'sections.answers.answer': answer,
                                        createdAt: { $gt: t0.toDate() }
                                    }
                                },
                                {
                                    $group: {
                                        _id: {
                                            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
                                        },
                                        count: { $sum: 1 }
                                    }
                                }
                            ])];
                    case 2:
                        cleanDispatch = _b.sent();
                        for (_i = 0, cleanDispatch_1 = cleanDispatch; _i < cleanDispatch_1.length; _i++) {
                            datum = cleanDispatch_1[_i];
                            day = datum._id;
                            sum = datum.count;
                            console.log(datum);
                            daysDict_1[day].clean = sum;
                        }
                        return [4 /*yield*/, participant_model_1["default"].aggregate([
                                {
                                    $match: {
                                        team: team,
                                        form: form._id,
                                        'sections.answers.answer': { $ne: answer },
                                        createdAt: { $gt: t0.toDate() }
                                    }
                                },
                                {
                                    $group: {
                                        _id: {
                                            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
                                        },
                                        count: { $sum: 1 }
                                    }
                                }
                            ])];
                    case 3:
                        notCleanDispatch = _b.sent();
                        for (_a = 0, notCleanDispatch_1 = notCleanDispatch; _a < notCleanDispatch_1.length; _a++) {
                            datum = notCleanDispatch_1[_a];
                            day = datum._id;
                            sum = datum.count;
                            console.log(day);
                            daysDict_1[day].notClean = sum;
                        }
                        _b.label = 4;
                    case 4:
                        res.json({
                            days: days,
                            clean: days.map(function (d) { return daysDict_1[d].clean; }),
                            notClean: days.map(function (d) { return daysDict_1[d].notClean; })
                        });
                        return [3 /*break*/, 6];
                    case 5:
                        e_13 = _b.sent();
                        Raven.captureException(e_13, { req: req });
                        /* istanbul ignore next */
                        logger_service_1["default"].error("dashboard timing: Async Error.");
                        /* istanbul ignore next */
                        logger_service_1["default"].error("{user: {_id: ".concat(req.user._id, ", email: ").concat(req.user.email, "}}"));
                        /* istanbul ignore next */
                        logger_service_1["default"].error(e_13);
                        res.status(400).json({
                            message: 'Ha ocurrido un error',
                            status: 400
                        });
                        return [3 /*break*/, 6];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    FormController.prototype.autoRotate = function (path) {
        // doc http://aheckmann.github.io/gm/docs.html
        /**** REQUIRE: imagemagick and graphicsmagick *****
         brew install imagemagick
         brew install graphicsmagick
         * */
        return new Promise(function (resolve, reject) {
            GraphicsMagick(path)
                .autoOrient()
                .write(path, function (err) {
                if (err) {
                    /* istanbul ignore next */
                    reject(err);
                }
                else {
                    resolve({});
                }
            });
        });
    };
    FormController.prototype.getForms = function (filter) {
        return new Promise(function (resolve, reject) {
            form_model_1["default"]
                .find(filter, {
                _id: 1,
                name: 1
            })
                .lean()
                .exec(function (err, forms) {
                if (err) {
                    /* istanbul ignore next */
                    return reject(err);
                }
                return resolve(forms);
            });
        });
    };
    FormController.prototype.getForm = function (filter) {
        var _this = this;
        var keyCache = "form-".concat(filter._id);
        logger_service_1["default"].debug("keyCache ".concat(keyCache));
        return new Promise(function (resolve, reject) {
            redis_service_1["default"].get(keyCache, function (error, result) { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    if (result) {
                        logger_service_1["default"].debug("FROM CACHE");
                        resolve(JSON.parse(result));
                    }
                    else {
                        logger_service_1["default"].debug("NEW CACHE");
                        form_model_1["default"]
                            .findOne(filter, {
                            'company': false,
                            'updatedAt': false,
                            'createdAt': false,
                            'active': false,
                            'sections.shortName': false,
                            'sections.questions.shortName': false,
                            '__v': false
                        })
                            .populate([{
                                path: 'sections.questions.damages',
                                select: ['name', 'positions', 'kinds', 'parts', 'partFallback', 'kindFallback'],
                                populate: [{
                                        path: 'positions',
                                        select: ['name'],
                                        options: {
                                            sort: {
                                                name: 1
                                            }
                                        }
                                    }, {
                                        path: 'kinds',
                                        select: ['name'],
                                        options: {
                                            sort: {
                                                name: 1
                                            }
                                        }
                                    }, {
                                        path: 'parts',
                                        select: ['name'],
                                        options: {
                                            sort: {
                                                name: 1
                                            }
                                        }
                                    }, {
                                        path: 'kindFallback',
                                        select: ['name'],
                                        options: {
                                            sort: {
                                                name: 1
                                            }
                                        }
                                    }, {
                                        path: 'partFallback',
                                        select: ['name'],
                                        options: {
                                            sort: {
                                                name: 1
                                            }
                                        }
                                    }]
                            }])
                            .lean()
                            .exec(function (err, form) {
                            if (err) {
                                /* istanbul ignore next */
                                return reject(err);
                            }
                            if (form) {
                                redis_service_1["default"].set(keyCache, JSON.stringify(form), 'ex', 60);
                                return resolve(form);
                            }
                            return reject('No se encontro formularío');
                        });
                    }
                    return [2 /*return*/];
                });
            }); });
        });
    };
    FormController.prototype.processAccesoryItems = function (accesories) {
        return __awaiter(this, void 0, void 0, function () {
            var accesorySchema, newAccesories;
            return __generator(this, function (_a) {
                accesorySchema = Joi.object({
                    item: Joi.string(),
                    amount: Joi.number()
                });
                newAccesories = [];
                accesories.map(function (accesory) {
                    try {
                        var newAccesory = accesorySchema.validate(accesory);
                        newAccesories.push({
                            item: newAccesory.value.item,
                            amount: newAccesory.value.amount
                        });
                    }
                    catch (e) {
                        newAccesories.push({
                            item: accesory,
                            amount: 1
                        });
                    }
                });
                return [2 /*return*/, newAccesories];
            });
        });
    };
    FormController.prototype.getFormWithScale = function (filter) {
        return new Promise(function (resolve, reject) {
            form_model_1["default"]
                .findOne(filter)
                .populate([{
                    path: 'sections.questions.scale'
                }, {
                    path: 'sections.questions.damages',
                    select: ['name', 'positions', 'kinds', 'parts'],
                    populate: [{
                            path: 'positions',
                            select: ['name']
                        }, {
                            path: 'kinds',
                            select: ['name']
                        }, {
                            path: 'parts',
                            select: ['name']
                        }]
                }])
                .exec(function (err, form) {
                if (err) {
                    /* istanbul ignore next */
                    return reject(err);
                }
                if (form) {
                    return resolve(form);
                }
                return reject('No se encontro formularío');
            });
        });
    };
    FormController.prototype.getScales = function (filter) {
        var _this = this;
        var keyCache = "scales-".concat(JSON.stringify(filter));
        return new Promise(function (resolve, reject) {
            redis_service_1["default"].get(keyCache, function (error, result) { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    if (result) {
                        resolve(JSON.parse(result));
                    }
                    else {
                        scale_model_1["default"]
                            .find(filter, {
                            'updatedAt': false,
                            'createdAt': false,
                            'active': false,
                            'company': false,
                            'minValue': false,
                            'maxValue': false,
                            'choices.na': false,
                            'team': false,
                            '__v': false
                        })
                            .lean()
                            .exec(function (err, scales) {
                            if (err) {
                                /* istanbul ignore next */
                                return reject(err);
                            }
                            redis_service_1["default"].set(keyCache, JSON.stringify(scales), 'ex', 30);
                            return resolve(scales);
                        });
                    }
                    return [2 /*return*/];
                });
            }); });
        });
    };
    FormController.prototype.createPosition = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, company, venue, team, _b, lat, lng, accuracy, provider, os, gpsPosition, e_14;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 2, , 3]);
                        _a = req.user, company = _a.company, venue = _a.venue;
                        team = req.user.team._id;
                        _b = req.body, lat = _b.lat, lng = _b.lng, accuracy = _b.accuracy, provider = _b.provider;
                        os = 'user-agent' in req.headers ? req.headers['user-agent'] : '';
                        gpsPosition = new gpsPosition_model_1["default"]({
                            lat: lat,
                            lng: lng,
                            user: req.user,
                            company: company,
                            team: team,
                            venue: venue,
                            os: os,
                            accuracy: accuracy,
                            provider: provider
                        });
                        return [4 /*yield*/, gpsPosition.save()];
                    case 1:
                        _c.sent();
                        res.json({
                            status: 200
                        });
                        return [3 /*break*/, 3];
                    case 2:
                        e_14 = _c.sent();
                        Raven.captureException(e_14, { req: req });
                        /* istanbul ignore next */
                        logger_service_1["default"].error("position create. Error");
                        /* istanbul ignore next */
                        logger_service_1["default"].error("{user: {_id: ".concat(req.user._id, ", email: ").concat(req.user.email, "}}"));
                        /* istanbul ignore next */
                        logger_service_1["default"].error(e_14);
                        res.status(400).json({
                            message: 'Ha ocurrido un error',
                            status: 400
                        });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return FormController;
}());
exports["default"] = new FormController();
//# sourceMappingURL=form.controller.js.map