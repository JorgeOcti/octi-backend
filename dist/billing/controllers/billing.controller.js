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
var invoice_model_1 = require("../models/invoice.model");
var billing_task_1 = require("../tasks/billing.task");
var HtmlPdf = require("html-pdf");
var excel = require("exceljs");
var tempfile = require("tempfile");
var activityHistory_model_1 = require("../models/activityHistory.model");
var moment = require("moment-timezone");
var BillingController = /** @class */ (function () {
    function BillingController() {
        this.index = this.index.bind(this);
        this.apiList = this.apiList.bind(this);
        this.apiDetail = this.apiDetail.bind(this);
        this.pdf = this.pdf.bind(this);
        this.run = this.run.bind(this);
    }
    /* istanbul ignore next */
    BillingController.prototype.index = function (req, res) {
        res.render('app/index');
    };
    BillingController.prototype.pdf = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var id, debug, invoice_1, billing, html, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        id = req.params.id;
                        debug = req.query.debug;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, invoice_model_1["default"].findById(id).populate([{ path: 'company' }])];
                    case 2:
                        invoice_1 = _a.sent();
                        if (invoice_1) {
                            billing = new billing_task_1["default"]();
                            html = billing.generateHTML(invoice_1);
                            // new BillingQueue().createPDF(invoice);
                            if (debug) {
                                res.send(html);
                            }
                            else {
                                HtmlPdf.create(html, billing.PDFconfig).toStream(function (err, pdfStream) {
                                    if (err) {
                                        console.log(err);
                                        res.sendStatus(500);
                                    }
                                    else {
                                        // set header
                                        res.setHeader('Content-Type', 'application/pdf');
                                        res.setHeader('Content-disposition', "inline; filename=".concat(invoice_1._id.toString(), ".pdf"));
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
                        }
                        else {
                            res.status(400).json({
                                message: 'Invoice no encontrado.'
                            });
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        e_1 = _a.sent();
                        res.status(500).json(e_1);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    BillingController.prototype.apiDetail = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var company, workbook, worksheet, columns, activities, rows, _i, activities_1, activity, tempFilePath, e_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        company = req.user.company;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        workbook = new excel.Workbook();
                        worksheet = workbook.addWorksheet('Usuarios', {
                            properties: {
                                defaultRowHeight: 30
                            }, pageSetup: {
                                fitToPage: true, fitToHeight: 100, fitToWidth: 1
                            }
                        });
                        worksheet.autoFilter = { from: 'A1', to: 'F1' };
                        columns = [{
                                header: 'Vin',
                                key: 'vin',
                                width: 30,
                                alignment: {
                                    wrapText: true
                                }
                            }, {
                                header: 'Inventario',
                                key: 'inventory',
                                width: 5,
                                style: {
                                    alignment: {
                                        vertical: 'middle',
                                        horizontal: 'center'
                                    }
                                }
                            }, {
                                header: 'Fecha',
                                key: 'created',
                                width: 5,
                                style: {
                                    alignment: {
                                        vertical: 'middle',
                                        horizontal: 'center'
                                    },
                                    numFmt: 'dd/mm/yyyy hh:mm'
                                }
                            }];
                        worksheet.columns = columns;
                        worksheet.autoFilter = {
                            from: 'A1',
                            to: {
                                row: 1,
                                column: columns.length
                            }
                        };
                        return [4 /*yield*/, activityHistory_model_1["default"].find({
                                company: company,
                                type: activityHistory_model_1.ChoicesTypeActivity.inventory,
                                createdAt: {
                                    $gte: moment()
                                        .subtract(30, 'day')
                                        .startOf('month')
                                        .toDate(),
                                    $lte: moment()
                                        .subtract(30, 'day')
                                        .endOf('month')
                                        .toDate()
                                }
                            })];
                    case 2:
                        activities = _a.sent();
                        rows = [];
                        for (_i = 0, activities_1 = activities; _i < activities_1.length; _i++) {
                            activity = activities_1[_i];
                            // console.log(activity);
                            rows.push({
                                vin: activity.car.vin,
                                inventory: activity.inventory.name,
                                created: activity.createdAt
                            });
                        }
                        worksheet.addRows(rows);
                        tempFilePath = tempfile('.xlsx');
                        return [4 /*yield*/, workbook.xlsx.writeFile(tempFilePath)];
                    case 3:
                        _a.sent();
                        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                        res.setHeader('Content-Disposition', 'attachment; filename=detalle-billing-21-03-2019.xlsx');
                        return [2 /*return*/, res.sendFile(tempFilePath)];
                    case 4:
                        e_2 = _a.sent();
                        console.log(e_2);
                        return [2 /*return*/, res.status(500).json({
                                message: 'Ha ocurrido un error. Comunicate con soporte para que te ayudemos a solucionarlo.'
                            })];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    BillingController.prototype.apiList = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var company, team, _a, page, pageSize, options, filter, invoices, e_3;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        company = req.user.company;
                        team = req.user.team._id;
                        _a = req.query, page = _a.page, pageSize = _a.pageSize;
                        options = {
                            populate: [{
                                    path: 'company',
                                    select: ['_id', 'name']
                                }],
                            sort: {
                                _id: -1
                            },
                            page: parseInt(page ? page : '1', 10),
                            limit: parseInt(pageSize ? pageSize : '20', 10)
                        };
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        filter = req.user.isAdmin ? { team: team } : { company: company };
                        return [4 /*yield*/, this.getInvoices(filter, options)];
                    case 2:
                        invoices = _b.sent();
                        if (options.page && invoices.pages && invoices.pages < options.page) {
                            res.status(400).json({
                                message: 'La página solicitada no existe.',
                                status: 400
                            });
                        }
                        else {
                            res.json({
                                count: invoices.total,
                                pages: invoices.pages,
                                hasPrevious: options.page && options.page > 1 && invoices.pages && invoices.pages >= options.page,
                                hasNext: options.page && invoices.pages && invoices.pages > options.page,
                                results: invoices.docs,
                                status: 200
                            });
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        e_3 = _b.sent();
                        /* istanbul ignore next  */
                        if (e_3) {
                            res.status(500).json(e_3);
                        }
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    BillingController.prototype.run = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var team, e_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        team = req.user.team._id;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, new billing_task_1["default"]().processBilling(team)];
                    case 2:
                        _a.sent();
                        res.json({
                            status: 'ok'
                        });
                        return [3 /*break*/, 4];
                    case 3:
                        e_4 = _a.sent();
                        /* istanbul ignore next  */
                        if (e_4) {
                            res.status(500).json(e_4);
                        }
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    BillingController.prototype.getInvoices = function (filter, options) {
        return new Promise(function (resolve, reject) {
            invoice_model_1["default"].paginate(filter, options, function (err, result) {
                /* istanbul ignore next  */
                if (err) {
                    return reject(err);
                }
                return resolve(result);
            });
        });
    };
    return BillingController;
}());
exports["default"] = new BillingController();
//# sourceMappingURL=billing.controller.js.map