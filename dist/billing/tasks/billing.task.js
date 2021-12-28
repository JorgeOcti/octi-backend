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
var fs = require("fs");
var HtmlPdf = require("html-pdf");
var moment = require("moment-timezone");
var path = require("path");
var Raven = require("raven");
var request = require("request");
var app_1 = require("../../app");
var company_model_1 = require("../../app/models/company.model");
var general_utils_1 = require("../../utils/general.utils");
var activityHistory_model_1 = require("../models/activityHistory.model");
var invoice_model_1 = require("../models/invoice.model");
var BillingQueue = /** @class */ (function () {
    function BillingQueue() {
        this.apiKey = '6d9b28d228cd00669f37484223d876daad754636';
        this.PDFconfig = {
            directory: 'tmp',
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
        this.processBilling = this.processBilling.bind(this);
        this.calculateCarsInChecklist = this.calculateCarsInChecklist.bind(this);
        this.calculateCarsInInventory = this.calculateCarsInInventory.bind(this);
        this.calculateCarsInRequest = this.calculateCarsInRequest.bind(this);
        this.getUFPrice = this.getUFPrice.bind(this);
        this.getDolarPrice = this.getDolarPrice.bind(this);
        this.generateHTML = this.generateHTML.bind(this);
        this.createPDF = this.createPDF.bind(this);
        this.sendEmail = this.sendEmail.bind(this);
    }
    BillingQueue.prototype.getUFPrice = function () {
        return new Promise(function (resolve, reject) {
            try {
                var now = moment().subtract(1, 'day');
                var _a = [now.format('YYYY'), now.format('MM'), now.format('DD')], year = _a[0], month = _a[1], day = _a[2];
                request.get("https://mindicador.cl/api/uf/".concat(day, "-").concat(month, "-").concat(year), function (err, resp, body) {
                    if (err) {
                        reject(err);
                    }
                    else {
                        var dailyIndicators = JSON.parse(body);
                        var value = parseFloat(dailyIndicators.serie[0].valor);
                        resolve(value);
                    }
                });
            }
            catch (error) {
                console.log(error);
            }
        });
    };
    BillingQueue.prototype.getDolarPrice = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var now = moment().subtract(1, 'day');
            var _a = [now.format('YYYY'), now.format('MM'), now.format('DD')], year = _a[0], month = _a[1], day = _a[2];
            request.get("https://api.sbif.cl/api-sbifv3/recursos_api/dolar/".concat(year, "/").concat(month, "/dias/").concat(day, "?apikey=").concat(_this.apiKey, "&formato=json"), function (err, resp, body) {
                if (err) {
                    reject(err);
                }
                else {
                    console.log(body);
                    resolve(parseFloat(JSON.parse(body).Dolares[0].Valor.replace('.', '').replace(',', '.')));
                }
            });
        });
    };
    BillingQueue.prototype.calculateCarsInChecklist = function (company) {
        return __awaiter(this, void 0, void 0, function () {
            var vinInChecklist;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, activityHistory_model_1["default"]
                            .aggregate([{
                                $match: {
                                    company: company._id,
                                    type: activityHistory_model_1.ChoicesTypeActivity.checklist,
                                    createdAt: {
                                        $gte: moment()
                                            .subtract(1, 'day')
                                            .startOf('month')
                                            .toDate(),
                                        $lte: moment()
                                            .subtract(1, 'day')
                                            .endOf('month')
                                            .toDate()
                                    }
                                }
                            }, {
                                $group: {
                                    _id: '$car.vin'
                                }
                            }, {
                                $group: {
                                    _id: 1,
                                    count: {
                                        $sum: 1
                                    }
                                }
                            }])];
                    case 1:
                        vinInChecklist = _a.sent();
                        return [2 /*return*/, vinInChecklist.length ? vinInChecklist[0].count : 0];
                }
            });
        });
    };
    BillingQueue.prototype.calculateCarsInInventory = function (company) {
        return __awaiter(this, void 0, void 0, function () {
            var vinInInventories;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, activityHistory_model_1["default"]
                            .aggregate([{
                                $match: {
                                    company: company._id,
                                    type: activityHistory_model_1.ChoicesTypeActivity.inventory,
                                    createdAt: {
                                        $gte: moment()
                                            .subtract(1, 'day')
                                            .startOf('month')
                                            .toDate(),
                                        $lte: moment()
                                            .subtract(1, 'day')
                                            .endOf('month')
                                            .toDate()
                                    }
                                }
                            }, {
                                $group: {
                                    _id: '$car.vin'
                                }
                            }, {
                                $group: {
                                    _id: 1,
                                    count: {
                                        $sum: 1
                                    }
                                }
                            }])];
                    case 1:
                        vinInInventories = _a.sent();
                        return [2 /*return*/, vinInInventories.length ? vinInInventories[0].count : 0];
                }
            });
        });
    };
    BillingQueue.prototype.calculateCarsInRequest = function (company) {
        return __awaiter(this, void 0, void 0, function () {
            var vinInInventories;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, activityHistory_model_1["default"]
                            .aggregate([{
                                $match: {
                                    company: company._id,
                                    type: activityHistory_model_1.ChoicesTypeActivity.request,
                                    createdAt: {
                                        $gte: moment()
                                            .subtract(1, 'day')
                                            .startOf('month')
                                            .toDate(),
                                        $lte: moment()
                                            .subtract(1, 'day')
                                            .endOf('month')
                                            .toDate()
                                    }
                                }
                            }, {
                                $group: {
                                    _id: '$_id'
                                }
                            }, {
                                $group: {
                                    _id: 1,
                                    count: {
                                        $sum: 1
                                    }
                                }
                            }])];
                    case 1:
                        vinInInventories = _a.sent();
                        return [2 /*return*/, vinInInventories.length ? vinInInventories[0].count : 0];
                }
            });
        });
    };
    BillingQueue.prototype.generateHTML = function (invoice) {
        moment.locale('es');
        moment.tz.setDefault('America/Santiago');
        var css = fs.readFileSync("".concat(path.join(__dirname, '../../../views/'), "billing/pdf/style.css"), 'utf8');
        var templatePath = "".concat(path.join(__dirname, '../../../views/'), "billing/pdf/index.pug");
        return general_utils_1["default"].generateHtmlFromPugFile(templatePath, {
            css: css.replace(/(\r\n|\n|\r)/gm, ''),
            moment: moment,
            invoice: invoice,
            jsUcfirst: function (text) { return (text.charAt(0).toUpperCase() + text.slice(1)); }
        });
    };
    BillingQueue.prototype.createPDF = function (invoice, company) {
        return __awaiter(this, void 0, void 0, function () {
            var newInvoice_1, e_1;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, invoice_model_1["default"].findById(invoice._id)
                                .populate([{
                                    path: 'company'
                                }, {
                                    path: 'team'
                                }])];
                    case 1:
                        newInvoice_1 = _a.sent();
                        if (newInvoice_1) {
                            HtmlPdf
                                .create(this.generateHTML(newInvoice_1), this.PDFconfig)
                                .toFile("/tmp/invoice-".concat(invoice._id, ".pdf"), function (err, res) { return __awaiter(_this, void 0, void 0, function () {
                                var _this = this;
                                return __generator(this, function (_a) {
                                    if (err)
                                        return [2 /*return*/, console.log(err)];
                                    invoice.attach('file', {
                                        originalname: "invoice-".concat(invoice._id, ".pdf"),
                                        team: "".concat(newInvoice_1.team._id, " ").concat(newInvoice_1.team.name),
                                        company: "".concat(newInvoice_1.company._id, " ").concat(newInvoice_1.company.name),
                                        createdAt: moment(newInvoice_1.createdAt).subtract(1, 'month').format('YYYY-MM'),
                                        path: res.filename
                                    }, function (error) { return __awaiter(_this, void 0, void 0, function () {
                                        return __generator(this, function (_a) {
                                            switch (_a.label) {
                                                case 0:
                                                    if (!error) return [3 /*break*/, 1];
                                                    /* istanbul ignore next */
                                                    console.log(error);
                                                    return [3 /*break*/, 3];
                                                case 1: return [4 /*yield*/, invoice.update({ file: invoice.file })];
                                                case 2:
                                                    _a.sent();
                                                    this.sendEmail(invoice, company);
                                                    _a.label = 3;
                                                case 3: return [2 /*return*/];
                                            }
                                        });
                                    }); });
                                    return [2 /*return*/];
                                });
                            }); });
                        }
                        return [3 /*break*/, 3];
                    case 2:
                        e_1 = _a.sent();
                        Raven.captureException(e_1);
                        console.log(e_1.message);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    BillingQueue.prototype.sendEmail = function (invoice, company) {
        var period = moment(invoice.createdAt).subtract(1, 'month').format('MMMM YYYY');
        for (var _i = 0, _a = company.notifications; _i < _a.length; _i++) {
            var notification = _a[_i];
            app_1.queue.create('email', {
                from: '',
                title: "Billing for ".concat(invoice.company.name),
                to: "\"".concat(notification.name, "\"<").concat(notification.email),
                subject: "Billing ".concat(invoice.company.name, " - ").concat(period),
                text: "",
                attachments: {
                    filename: "".concat(invoice.company.name, " ").concat(period, ".pdf"),
                    path: decodeURI(invoice.file.url)
                },
                view: 'billing/report',
                context: {
                    period: period,
                    name: notification.name,
                    company: invoice.company.name
                }
            }).priority('high').attempts(5).save();
        }
    };
    BillingQueue.prototype.processBilling = function (team) {
        return __awaiter(this, void 0, void 0, function () {
            var valueUF, filter, companies, _i, companies_1, company, inventoryCars, checklistCars, requestCars, totalInventory, totalChecklist, totalRequest, totalUF, period, invoice, e_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 12, , 13]);
                        console.log('start billing');
                        return [4 /*yield*/, this.getUFPrice()];
                    case 1:
                        valueUF = _a.sent();
                        filter = {
                            'billing.active': true
                        };
                        if (team) {
                            filter.team = team;
                        }
                        return [4 /*yield*/, company_model_1["default"].find(filter)];
                    case 2:
                        companies = _a.sent();
                        _i = 0, companies_1 = companies;
                        _a.label = 3;
                    case 3:
                        if (!(_i < companies_1.length)) return [3 /*break*/, 11];
                        company = companies_1[_i];
                        console.log("calculating billing ".concat(company.name));
                        return [4 /*yield*/, this.calculateCarsInInventory(company)];
                    case 4:
                        inventoryCars = _a.sent();
                        return [4 /*yield*/, this.calculateCarsInChecklist(company)];
                    case 5:
                        checklistCars = _a.sent();
                        return [4 /*yield*/, this.calculateCarsInRequest(company)];
                    case 6:
                        requestCars = _a.sent();
                        totalInventory = inventoryCars * company.billing.inventoryPrice;
                        totalChecklist = checklistCars * company.billing.checklistPrice;
                        totalRequest = requestCars * company.billing.requestPrice;
                        totalUF = totalInventory + totalChecklist + totalRequest;
                        period = moment().format('YYYYMM');
                        invoice = new invoice_model_1["default"]({
                            team: company.team,
                            company: company,
                            period: period,
                            inventoryCars: inventoryCars,
                            checklistCars: checklistCars,
                            requestCars: requestCars,
                            inventoryPrice: company.billing.inventoryPrice,
                            checklistPrice: company.billing.checklistPrice,
                            requestPrice: company.billing.requestPrice,
                            totalUF: totalUF,
                            valueUF: valueUF,
                            // valueDolar,
                            // totalDolar: (totalUF * valueUF) / valueDolar,
                            totalPeso: totalUF * valueUF
                        });
                        return [4 /*yield*/, invoice_model_1["default"].find({ company: company, period: period }).count()];
                    case 7:
                        if (!!(_a.sent())) return [3 /*break*/, 9];
                        return [4 /*yield*/, invoice.save()];
                    case 8:
                        _a.sent();
                        this.createPDF(invoice, company);
                        return [3 /*break*/, 10];
                    case 9:
                        console.log("".concat(period, " ").concat(company.name, " ya existe!!!."));
                        _a.label = 10;
                    case 10:
                        _i++;
                        return [3 /*break*/, 3];
                    case 11: return [3 /*break*/, 13];
                    case 12:
                        e_2 = _a.sent();
                        console.log(e_2);
                        return [3 /*break*/, 13];
                    case 13: return [2 /*return*/];
                }
            });
        });
    };
    return BillingQueue;
}());
exports["default"] = BillingQueue;
//# sourceMappingURL=billing.task.js.map