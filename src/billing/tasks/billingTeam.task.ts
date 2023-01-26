import * as HtmlPdf from 'html-pdf';
import * as moment from 'moment-timezone';

import * as request from 'request';
import { queue } from '../../utils/queue';
import TeamBilling from '../models/teamBilling.model';
import History from '../../app/models/history.model';
import Submodule from '../models/submodule.model';
import InvoiceTeamBilling, { IInvoiceTeamBillingModel } from '../models/invoiceTeamBilling.module';
import * as mongoose from 'mongoose';
import { Car } from '../../app/models';
import { IInvoiceTeamBilling } from '../interfaces/invoiceTeamBilling.interface';
import * as fs from 'fs';
import * as path from 'path';
import GeneralUtils from '../../utils/general.utils';
import { StatusHistory } from '../../app/models/history.types';

class BillingTeamQueue {

  private apiKey: string = '6d9b28d228cd00669f37484223d876daad754636';

  public PDFconfig: HtmlPdf.CreateOptions = {
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
  readonly car: any;

  constructor() {
    this.processBilling = this.processBilling.bind(this);
    this.getUFPrice = this.getUFPrice.bind(this);
    this.getDolarPrice = this.getDolarPrice.bind(this);
    this.generateHTML = this.generateHTML.bind(this);
    this.car = new Car({});
    this.createPDF = this.createPDF.bind(this);
    this.sendEmail = this.sendEmail.bind(this);
  }

  private getUFPrice(): Promise<number> {
    return new Promise((resolve, reject) => {
      try {
        const now = moment().subtract(1, 'day');
        const [year, month, day] = [now.format('YYYY'), now.format('MM'), now.format('DD')];
        const url = `https://mindicador.cl/api/uf/${day}-${month}-${year}`;
        console.log('url', url);
        request.get(url, (err, resp, body) => {
          if (err) {
            reject(err);
          } else {
            const dailyIndicators = JSON.parse(body);
            const value = parseFloat(dailyIndicators.serie[0].valor);
            resolve(value);
          }
        });
      } catch (error) {
        console.log(error);
      }
    });
  }

  private getDolarPrice(): Promise<number> {
    return new Promise((resolve, reject) => {
      const now = moment().subtract(1, 'day');
      const [year, month, day] = [now.format('YYYY'), now.format('MM'), now.format('DD')];
      const url = `https://api.sbif.cl/api-sbifv3/recursos_api/dolar/${year}/${month}/dias/${day}?apikey=${this.apiKey}&formato=json`;
      console.log('url', url);
      request.get(url, (err, resp, body) => {
        if (err) {
          reject(err);
        } else {
          console.log(body);
          resolve(parseFloat(JSON.parse(body).Dolares[0].Valor.replace('.', '').replace(',', '.')));
        }
      });
    });
  }

  public generateHTML(invoice: IInvoiceTeamBilling): string {
    moment.locale('es');
    moment.tz.setDefault('America/Santiago');
    const css = fs.readFileSync(`${path.join(__dirname, '../../../views/')}billing/pdf-corporate/style.css`, 'utf8');
    const templatePath: string = `${path.join(__dirname, '../../../views/')}billing/pdf-corporate/index.pug`;
    return GeneralUtils.generateHtmlFromPugFile(templatePath, {
      css: css.replace(/(\r\n|\n|\r)/gm, ''),
      moment,
      invoice,
      jsUcfirst: (text: string) => (text.charAt(0).toUpperCase() + text.slice(1))
    });
  }

  public async createPDF(invoice: IInvoiceTeamBillingModel): Promise<void> {
    try {
      const newInvoice = await InvoiceTeamBilling.findById(invoice._id)
        .populate([{
          path: 'team'
        }, {
          path: 'companies.company',
          select: ['_id', 'name']
        }]);
      if (newInvoice) {
        HtmlPdf
          .create(this.generateHTML(newInvoice), this.PDFconfig)
          .toFile(`/tmp/invoice-${invoice._id}.pdf`, async (err, res) => {
            if (err) return console.log(err);
            invoice.attach('file', {
              originalname: `invoice-${invoice._id}.pdf`,
              team: `${newInvoice.team._id} ${newInvoice.team.name}`,
              createdAt: moment(newInvoice.createdAt).subtract(1, 'month').format('YYYY-MM'),
              path: res.filename
            }, async (error: any) => {
              if (error) {
                console.log(error);
              } else {
                await invoice.update({ file: invoice.file });
                this.sendEmail(invoice);
              }
            });
          });
      }
    } catch (e) {
      // Raven.captureException(e);
      console.log(e.message);
    }
  }

  private sendEmail(invoice: IInvoiceTeamBillingModel): void {
    const period = moment(invoice.createdAt).format('MMMM YYYY');
    for (const notification of invoice.teamBilling.notifications) {
      queue.create('email', {
        from: '',
        title: `Billing for ${invoice.team.name}`,
        to: `"${notification.name}"<${notification.email}`,
        subject: `Billing ${invoice.team.name} - ${period}`,
        text: ``,
        attachments: {
          filename: `${invoice.team.name} ${period}.pdf`,
          path: decodeURI(invoice.file.url)
        },
        view: 'billing/corporate-email',
        context: {
          invoice,
          period,
          name: notification.name
        }
      }).priority('high').attempts(5).save();
    }
  }

  public async processBilling(filter: any = {}, run?:boolean): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        run = run || moment().startOf('day').isSame(moment().endOf('month').startOf('day').subtract(3, 'days'));
        // const run = moment().startOf('day').isSame(moment().endOf('month').startOf('day').subtract(3, 'days'))
        // const run = true;
        if (run) {
          mongoose.set('debug', true);
          console.log('START billing');
          // const valueUF = 28662.81; /*await this.getUFPrice();*/
          // const valueDolar = 767.98; /*await this.getDolarPrice();*/
          // const valueUF = await this.getUFPrice();
          // const valueDolar = await this.getDolarPrice();
          const teamBillings = await TeamBilling.find(filter).populate([{
            path: 'team'
          }]);
          const subModules = await Submodule.find({});
          const infoByType: any = subModules.reduce((acc: any, cur: any) => {
            acc[cur.type] = {
              'module': cur.module.toString(),
              'subModule': cur._id.toString()
            };
            return acc;
          }, {});
          for (const teamBilling of teamBillings) {
            const now = moment().startOf('day');
            const lastInvoice = await InvoiceTeamBilling.findOne({
              team: teamBilling.team._id
            }).sort({
              createdAt: -1
            });
            const from = lastInvoice
              ? lastInvoice.to
              : new Date(
                  `${now.startOf('month').format('YYYY-MM-DD')}T00:00:00.000Z`
                );
            const to= now;
            // let to = moment().endOf('month').subtract(3, 'days').startOf('day');
            // If the script runs earlier than automatically scheduled
            // if (now.isBefore(to)) {
            //   to = now;
            // }
            const histories = await History.find(
              {
                company: { $in: teamBilling.companies },
                status: {
                  $in: [StatusHistory.available, StatusHistory.inTransit, StatusHistory.sale]
                },
                executedAt: {
                  $gte: from,
                  $lte: to
                }
              }, {
                company: 1,
                car: 1,
                module: 1
              })
              .populate([{
                path: 'car',
                select: ['vin']
              }])
              .sort({
                executedAt: 1
              });
            const usedVINS: any[] = [];
            const countByModule: any = {};
            const countBySubmodule: any = {};
            const countByCompany: any = {};
            const uniqueHistories: any[] = [];

            for (const history of histories) {
              if (history.module in infoByType && history?.car?.vin?.trim()?.length && !usedVINS.includes(history.car.vin)) {
                uniqueHistories.push(history._id);
                usedVINS.push(history.car.vin);
                const info = infoByType[history.module];

                if (info.module in countByModule) {
                  countByModule[`${info.module}`] = {
                    _id: info.module,
                    count: countByModule[`${info.module}`].count + 1,
                    histories: [...countByModule[`${info.module}`].histories, history._id]
                  };
                } else {
                  countByModule[`${info.module}`] = {
                    _id: info.module,
                    count: 1,
                    histories: [history._id]
                  };
                }

                if (info.subModule in countBySubmodule) {
                  countBySubmodule[`${info.subModule}`] = {
                    _id: info.subModule,
                    count: countBySubmodule[`${info.subModule}`].count + 1,
                    histories: [...countBySubmodule[`${info.subModule}`].histories, history._id]
                  };
                } else {
                  countBySubmodule[`${info.subModule}`] = {
                    _id: info.subModule,
                    count: 1,
                    histories: [history._id]
                  };
                }

                if (history.company in countByCompany) {
                  countByCompany[`${history.company}`] = {
                    _id: history.company,
                    count: countByCompany[`${history.company}`].count + 1,
                    histories: [...countByCompany[`${history.company}`].histories, history._id]
                  };
                } else {
                  countByCompany[`${history.company}`] = {
                    _id: history.company,
                    count: 1,
                    histories: [history._id]
                  };
                }
              }
            }
            console.log({
              countByModule,
              countByCompany,
              countBySubmodule
            });
            const period = now.format('YYYYMM');
            let sumUFbyModule: any = {};
            let totalDolar = 0;
            teamBilling.modules.forEach((module: any) => {
              if (module.module in countByModule) {
                module.sections
                  .sort((a: any, b: any) => {
                    if (a.start < b.start) {
                      return -1;
                    }
                    if (a.start > b.start) {
                      return 1;
                    }
                    return 0;
                  })
                  .forEach((section: any) => {
                    new Array(countByModule[`${module.module}`].count).fill(0).forEach((_, index: number) => {
                      const item = index + 1;
                      if (item >= section.start && item <= section.end) {
                        totalDolar += section.price;
                        if (module.module in sumUFbyModule) {
                          const count = sumUFbyModule[`${module.module}`].count + 1;
                          const total = sumUFbyModule[`${module.module}`].total + section.price;
                          sumUFbyModule[`${module.module}`] = {
                            count,
                            total
                          };
                        } else {
                          sumUFbyModule[`${module.module}`] = {
                            count: 1,
                            total: section.price
                          };
                        }
                      }
                    });
                  });
              }
            });

            const invoiceData = {
              team: teamBilling.team,
              period,
              teamBilling,
              histories: histories.map((history: any) => history._id),
              uniqueHistories,
              modules: Object.values(countByModule).map((module: any) => ({
                module: module._id,
                histories: module.histories
              })),
              subModules: Object.values(countBySubmodule).map((subModule: any) => ({
                subModule: subModule._id,
                histories: subModule.histories
              })),
              companies: Object.values(countByCompany).map((company: any) => ({
                company: company._id,
                histories: company.histories
              })),
              // valueUF,
              // valueDolar,
              // totalUF,
              from,
              to,
              total: uniqueHistories.length,
              realDolar: totalDolar,
              totalDolar: totalDolar > teamBilling.baseCost ? totalDolar : teamBilling.baseCost
              // total
            };

            if (!await InvoiceTeamBilling.find({ team: teamBilling.team, period }).countDocuments()) {
              const invoice = new InvoiceTeamBilling(invoiceData);
              await invoice.save();
              this.createPDF(invoice);
            } else {
              console.log(`${period} ${teamBilling.team.name} ya existe!!!.`);
            }
          }
        }
        resolve({});

        /*const companies = await Company.find(filter);
        for (const company of companies) {
          console.log(`calculating billing ${company.name}`);
          const inventoryCars = await this.calculateCarsInInventory(company);
          const checklistCars = await this.calculateCarsInChecklist(company);
          const requestCars = await this.calculateCarsInRequest(company);
          const totalInventory = inventoryCars * company.billing.inventoryPrice;
          const totalChecklist = checklistCars * company.billing.checklistPrice;
          const totalRequest = requestCars * company.billing.requestPrice;
          const totalUF = totalInventory + totalChecklist + totalRequest;
          const period = moment().format('YYYYMM');
          const invoice = new Invoice({
            team: company.team,
            company,
            period,
            inventoryCars,
            checklistCars,
            requestCars,
            inventoryPrice: company.billing.inventoryPrice,
            checklistPrice: company.billing.checklistPrice,
            requestPrice: company.billing.requestPrice,
            totalUF,
            valueUF,
            // valueDolar,
            // totalDolar: (totalUF * valueUF) / valueDolar,
            totalPeso: totalUF * valueUF
          });
          if (!await Invoice.find({ company, period }).countDocuments()) {
            await invoice.save();
            this.createPDF(invoice, company);
          } else {
            console.log(`${period} ${company.name} ya existe!!!.`);
          }
        }*/
      } catch (e) {
        console.log(e);
        reject({});
      }
    });
  }
}

export default BillingTeamQueue;
