"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const invoice_model_1 = require("../models/invoice.model");
const billing_task_1 = require("../tasks/billing.task");
const HtmlPdf = require("html-pdf");
class BillingController {
    constructor() {
        this.index = this.index.bind(this);
        this.apiList = this.apiList.bind(this);
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
                    message: "Invoice no encontrado."
                });
            }
        }
        catch (e) {
            res.status(500).json(e);
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
            page: parseInt(page ? page : "1", 10),
            limit: parseInt(pageSize ? pageSize : "20", 10)
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
        try {
            await new billing_task_1.default().processBilling();
            res.json({
                status: "ok"
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