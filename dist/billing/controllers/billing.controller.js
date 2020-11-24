"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const invoice_model_1 = require("../models/invoice.model");
const billing_task_1 = require("../tasks/billing.task");
const HtmlPdf = require("html-pdf");
const excel = require("exceljs");
const tempfile = require("tempfile");
const activityHistory_model_1 = require("../models/activityHistory.model");
const moment = require("moment-timezone");
class BillingController {
    constructor() {
        this.index = this.index.bind(this);
        this.apiList = this.apiList.bind(this);
        this.apiDetail = this.apiDetail.bind(this);
        this.pdf = this.pdf.bind(this);
        this.run = this.run.bind(this);
    }
    /* istanbul ignore next */
    index(req, res) {
        res.render('app/index');
    }
    async pdf(req, res) {
        const { id } = req.params;
        const { debug } = req.query;
        try {
            const invoice = await invoice_model_1.default.findById(id).populate([{ path: 'company' }]);
            if (invoice) {
                const billing = new billing_task_1.default();
                const html = billing.generateHTML(invoice);
                // new BillingQueue().createPDF(invoice);
                if (debug) {
                    res.send(html);
                }
                else {
                    HtmlPdf.create(html, billing.PDFconfig).toStream((err, pdfStream) => {
                        if (err) {
                            console.log(err);
                            res.sendStatus(500);
                        }
                        else {
                            // set header
                            res.setHeader('Content-Type', 'application/pdf');
                            res.setHeader('Content-disposition', `inline; filename=${invoice._id.toString()}.pdf`);
                            // res.setHeader('Content-disposition', `attachment; filename=${participant._id.toString()}.pdf`);
                            // send a status code of 200 OK
                            res.statusCode = 200;
                            // once we are done reading end the response
                            pdfStream.on('end', () => {
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
        }
        catch (e) {
            res.status(500).json(e);
        }
    }
    async apiDetail(req, res) {
        const { company } = req.user;
        try {
            /* generate file */
            const workbook = new excel.Workbook();
            const worksheet = workbook.addWorksheet('Usuarios', {
                properties: {
                    defaultRowHeight: 30
                }, pageSetup: {
                    fitToPage: true, fitToHeight: 100, fitToWidth: 1
                }
            });
            worksheet.autoFilter = { from: 'A1', to: 'F1' };
            const columns = [{
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
            const activities = await activityHistory_model_1.default.find({
                company,
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
            });
            const rows = [];
            for (const activity of activities) {
                // console.log(activity);
                rows.push({
                    vin: activity.car.vin,
                    inventory: activity.inventory.name,
                    created: activity.createdAt
                });
            }
            worksheet.addRows(rows);
            /* formats */
            // worksheet.getRow(1).eachCell((cell) => {
            //   cell.font = {
            //     bold: true
            //   };
            // });
            const tempFilePath = tempfile('.xlsx');
            await workbook.xlsx.writeFile(tempFilePath);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=detalle-billing-21-03-2019.xlsx');
            return res.sendFile(tempFilePath);
        }
        catch (e) {
            console.log(e);
            return res.status(500).json({
                message: 'Ha ocurrido un error. Comunicate con soporte para que te ayudemos a solucionarlo.'
            });
        }
    }
    async apiList(req, res) {
        const { company, team } = req.user;
        const { page, pageSize } = req.query;
        const options = {
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
        try {
            const filter = req.user.isAdmin ? { team } : { company };
            const invoices = await this.getInvoices(filter, options);
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
        }
        catch (e) {
            /* istanbul ignore next  */
            if (e) {
                res.status(500).json(e);
            }
        }
    }
    async run(req, res) {
        const { team } = req.user;
        try {
            await new billing_task_1.default().processBilling(team);
            res.json({
                status: 'ok'
            });
        }
        catch (e) {
            /* istanbul ignore next  */
            if (e) {
                res.status(500).json(e);
            }
        }
    }
    getInvoices(filter, options) {
        return new Promise((resolve, reject) => {
            invoice_model_1.default.paginate(filter, options, (err, result) => {
                /* istanbul ignore next  */
                if (err) {
                    return reject(err);
                }
                return resolve(result);
            });
        });
    }
}
exports.default = new BillingController();
//# sourceMappingURL=billing.controller.js.map