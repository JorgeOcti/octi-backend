"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const HtmlPdf = require("html-pdf");
const moment = require("moment-timezone");
const path = require("path");
const Raven = require("raven");
const request = require("request");
const app_1 = require("../../app");
const company_model_1 = require("../../app/models/company.model");
const general_utils_1 = require("../../utils/general.utils");
const activityHistory_model_1 = require("../models/activityHistory.model");
const invoice_model_1 = require("../models/invoice.model");
class BillingQueue {
    constructor() {
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
        this.getUFPrice = this.getUFPrice.bind(this);
        this.getDolarPrice = this.getDolarPrice.bind(this);
        this.generateHTML = this.generateHTML.bind(this);
        this.createPDF = this.createPDF.bind(this);
        this.sendEmail = this.sendEmail.bind(this);
    }
    getUFPrice() {
        return new Promise((resolve, reject) => {
            try {
                const now = moment().subtract(1, 'day');
                const [year, month, day] = [now.format('YYYY'), now.format('MM'), now.format('DD')];
                request.get(`https://mindicador.cl/api/uf/${day}-${month}-${year}`, (err, resp, body) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        const dailyIndicators = JSON.parse(body);
                        const value = parseFloat(dailyIndicators.serie[0].valor);
                        resolve(value);
                    }
                });
            }
            catch (error) {
                console.log(error);
            }
        });
    }
    getDolarPrice() {
        return new Promise((resolve, reject) => {
            const now = moment().subtract(1, 'day');
            const [year, month, day] = [now.format('YYYY'), now.format('MM'), now.format('DD')];
            request.get(`https://api.sbif.cl/api-sbifv3/recursos_api/dolar/${year}/${month}/dias/${day}?apikey=${this.apiKey}&formato=json`, (err, resp, body) => {
                if (err) {
                    reject(err);
                }
                else {
                    console.log(body);
                    resolve(parseFloat(JSON.parse(body).Dolares[0].Valor.replace('.', '').replace(',', '.')));
                }
            });
        });
    }
    async calculateCarsInChecklist(company) {
        const vinInChecklist = await activityHistory_model_1.default
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
            }]);
        return vinInChecklist.length ? vinInChecklist[0].count : 0;
    }
    async calculateCarsInInventory(company) {
        const vinInInventories = await activityHistory_model_1.default
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
            }]);
        return vinInInventories.length ? vinInInventories[0].count : 0;
    }
    generateHTML(invoice) {
        moment.locale('es');
        moment.tz.setDefault('America/Santiago');
        const css = fs.readFileSync(`${path.join(__dirname, '../../../views/')}billing/pdf/style.css`, 'utf8');
        const templatePath = `${path.join(__dirname, '../../../views/')}billing/pdf/index.pug`;
        return general_utils_1.default.generateHtmlFromPugFile(templatePath, {
            css: css.replace(/(\r\n|\n|\r)/gm, ''),
            moment,
            invoice
        });
    }
    async createPDF(invoice, company) {
        try {
            const newInvoice = await invoice_model_1.default.findById(invoice._id)
                .populate([{
                    path: 'company'
                }, {
                    path: 'team'
                }]);
            if (newInvoice) {
                HtmlPdf
                    .create(this.generateHTML(newInvoice), this.PDFconfig)
                    .toFile(`/tmp/invoice-${invoice._id}.pdf`, async (err, res) => {
                    if (err)
                        return console.log(err);
                    invoice.attach('file', {
                        originalname: `invoice-${invoice._id}.pdf`,
                        team: `${newInvoice.team._id} ${newInvoice.team.name}`,
                        company: `${newInvoice.company._id} ${newInvoice.company.name}`,
                        createdAt: moment(newInvoice.createdAt).subtract(1, 'month').format('YYYY-MM'),
                        path: res.filename
                    }, async (error) => {
                        if (error) {
                            /* istanbul ignore next */
                            console.log(error);
                        }
                        else {
                            await invoice.update({ file: invoice.file });
                            this.sendEmail(invoice, company);
                        }
                    });
                });
            }
        }
        catch (e) {
            Raven.captureException(e);
            console.log(e.message);
        }
    }
    sendEmail(invoice, company) {
        const period = moment(invoice.createdAt).subtract(1, 'month').format('MMMM YYYY');
        for (const notification of company.notifications) {
            app_1.queue.create('email', {
                from: '',
                title: `Billing for ${invoice.company.name}`,
                to: `"${notification.name}"<${notification.email}`,
                subject: `Billing ${invoice.company.name} - ${period}`,
                text: ``,
                attachments: {
                    filename: `${invoice.company.name} ${period}.pdf`,
                    path: decodeURI(invoice.file.url)
                },
                view: 'billing/report',
                context: {
                    period,
                    name: notification.name,
                    company: invoice.company.name
                }
            }).priority('high').attempts(5).save();
        }
    }
    async processBilling(team) {
        try {
            console.log('start billing');
            // const valueUF = 28662.81; /*await this.getUFPrice();*/
            // const valueDolar = 767.98; /*await this.getDolarPrice();*/
            const valueUF = await this.getUFPrice();
            const filter = {
                'billing.active': true
            };
            if (team) {
                filter.team = team;
            }
            const companies = await company_model_1.default.find(filter);
            for (const company of companies) {
                console.log(`calculating billing ${company.name}`);
                const inventoryCars = await this.calculateCarsInInventory(company);
                const checklistCars = await this.calculateCarsInChecklist(company);
                const totalInventory = inventoryCars * company.billing.inventoryPrice;
                const totalChecklist = checklistCars * company.billing.checklistPrice;
                const totalUF = totalInventory + totalChecklist;
                const invoice = new invoice_model_1.default({
                    team: company.team,
                    company,
                    inventoryCars,
                    checklistCars,
                    inventoryPrice: company.billing.inventoryPrice,
                    checklistPrice: company.billing.checklistPrice,
                    totalUF,
                    valueUF,
                    // valueDolar,
                    // totalDolar: (totalUF * valueUF) / valueDolar,
                    totalPeso: totalUF * valueUF
                });
                await invoice.save();
                this.createPDF(invoice, company);
            }
        }
        catch (e) {
            console.log(e);
        }
    }
}
exports.default = BillingQueue;
//# sourceMappingURL=billing.task.js.map