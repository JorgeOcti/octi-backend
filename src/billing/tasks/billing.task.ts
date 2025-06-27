import * as fs from 'fs';
import * as moment from 'moment-timezone';
import * as path from 'path';
import * as request from 'request';

import Invoice, { IInvoiceModel } from '../models/invoice.model';

// import ActivityHistory from '../models/activityHistory.model';
// import { ChoicesTypeActivity } from '../models/activiHistory.types';
import Company from '../../app/models/company.model';
import GeneralUtils from '../../utils/general.utils';
import type { ICompany } from '../../app/interfaces/company.interface';
import Participant from '../../form/models/participant.model';
import { RequestItem } from '../../request/models/requestItem.model';
import emailQueue from '../../app/tasks/email.task';
import puppeteer from 'puppeteer';
import * as console from "console";
// import History from "../../app/models/history.model";
import Inventory from "../../inventory/models/inventory.model";
import InventoryCar from "../../inventory/models/inventoryCar.model";
import Car from '../../app/models/car.model';

class BillingQueue {
  private apiKey: string = '6d9b28d228cd00669f37484223d876daad754636';

  constructor() {
    this.processBilling = this.processBilling.bind(this);
    this.calculateCarsInChecklist = this.calculateCarsInChecklist.bind(this);
    this.calculateCarsInInventory = this.calculateCarsInInventory.bind(this);
    this.calculateCarsInRequest = this.calculateCarsInRequest.bind(this);
    this.calculateCarsInDelivery = this.calculateCarsInDelivery.bind(this);
    this.getUFPrice = this.getUFPrice.bind(this);
    this.getDolarPrice = this.getDolarPrice.bind(this);
    this.generateHTML = this.generateHTML.bind(this);
    this.createPDF = this.createPDF.bind(this);
    this.sendEmail = this.sendEmail.bind(this);
  }

  private getUFPrice(): Promise<number> {
    return new Promise((resolve, reject) => {
      try {
        const now = moment().subtract(1, 'day');
        const [year, month, day] = [
          now.format('YYYY'),
          now.format('MM'),
          now.format('DD')
        ];
        request.get(
          `https://mindicador.cl/api/uf/${day}-${month}-${year}`,
          (err, resp, body) => {
            if (err) {
              reject(err);
            } else {
              const dailyIndicators = JSON.parse(body);
              const value = parseFloat(dailyIndicators.serie[0].valor);
              resolve(value);
            }
          }
        );
      } catch (error) {
        console.log(error);
      }
    });
  }

  private getDolarPrice(): Promise<number> {
    return new Promise((resolve, reject) => {
      const now = moment().subtract(1, 'day');
      const [year, month, day] = [
        now.format('YYYY'),
        now.format('MM'),
        now.format('DD')
      ];
      request.get(
        `https://api.sbif.cl/api-sbifv3/recursos_api/dolar/${year}/${month}/dias/${day}?apikey=${this.apiKey}&formato=json`,
        (err, resp, body) => {
          if (err) {
            reject(err);
          } else {
            console.log(body);
            resolve(
              parseFloat(
                JSON.parse(body)
                  .Dolares[0].Valor.replace('.', '')
                  .replace(',', '.')
              )
            );
          }
        }
      );
    });
  }

  private async calculateContainers(company: ICompany, start_date: moment.Moment, end_date: moment.Moment): Promise<number> {
    const inventories = await Inventory.find({
      company: company._id,
      createdAt: {
        $gte: start_date
          .toDate(),
        $lte: end_date
          .toDate()
      }
    }, { _id: 1})
    const iCars = await InventoryCar.find({
      inventory: {$in: inventories.map((i: {_id: any}) => i._id)}
    });

    const countCars = await Car.count({
      _id: {$in: iCars.map((ic: {car: any}) => ic.car)},
      company: company._id,
      createdAt: {
        $gte: start_date
          .toDate(),
        $lte: end_date
          .toDate()
      }
    })
    return countCars;
  }

  private async calculateCarsInChecklist(company: ICompany, start_date: moment.Moment, end_date: moment.Moment): Promise<number> {
    const countCarChecklist = await Participant.count({
      company: company._id,
      deliveryToCustomer: false,
      createdAt: {
        $gte: start_date
          .toDate(),
        $lte: end_date
          .toDate()
      }
    });
    // const vinInChecklist = await Participant.aggregate([
    //   {
    //     $match: {
    //       company: company._id,
    //       deliveryToCustomer: false,
    //       createdAt: {
    //         $gte: moment()
    //           // .subtract(1, 'month')
    //           .subtract(1, 'day')
    //           .startOf('month')
    //           .toDate(),
    //         $lte: moment()
    //           // .subtract(1, 'month')
    //           .subtract(1, 'day')
    //           .endOf('month')
    //           .toDate()
    //       }
    //     }
    //   },
    //   {
    //     $group: {
    //       _id: '$car'
    //     }
    //   },
    //   {
    //     $group: {
    //       _id: 1,
    //       count: {
    //         $sum: 1
    //       }
    //     }
    //   }
    // ]);
    return countCarChecklist //vinInChecklist.length ? vinInChecklist[0].count : 0;
  }

  private async calculateCarsInDelivery(company: ICompany, start_date: moment.Moment, end_date: moment.Moment): Promise<number> {
    const countCarDelivery = await Participant.count({
      company: company._id,
      deliveryToCustomer: true,
      createdAt: {
        $gte: start_date
          .toDate(),
        $lte: end_date
          .toDate()
      }
    })
    // const vinInDelivery = await Participant.aggregate([
    //   {
    //     $match: {
    //       company: company._id,
    //       deliveryToCustomer: true,
    //       createdAt: {
    //         $gte: moment()
    //           // .subtract(1, 'month')
    //           .subtract(1, 'day')
    //           .startOf('month')
    //           .toDate(),
    //         $lte: moment()
    //           // .subtract(1, 'month')
    //           .subtract(1, 'day')
    //           .endOf('month')
    //           .toDate()
    //       }
    //     }
    //   },
    //   {
    //     $group: {
    //       _id: '$car'
    //     }
    //   },
    //   {
    //     $group: {
    //       _id: 1,
    //       count: {
    //         $sum: 1
    //       }
    //     }
    //   }
    // ]);
    return countCarDelivery //vinInDelivery.length ? vinInDelivery[0].count : 0;
  }

  private async calculateCarsInInventory(company: ICompany, start_date: moment.Moment, end_date: moment.Moment): Promise<number> {
    const inventories = await Inventory.find({
      company: company._id,
      createdAt: {
        $gte: start_date
          .toDate(),
        $lte: end_date
          .toDate()
      }
    });

    const countInventoryCars = await InventoryCar.count({
      inventory: {$in: inventories.map(i => i._id)}
    });

    // const countInventoryCars = await History.count({
    //   company: company._id,
    //   module: ChoicesTypeActivity.inventory,
    //   createdAt: {
    //     $gte: moment()
    //       .subtract(1, 'month')
    //       .subtract(1, 'day')
    //       .startOf('month')
    //       .toDate(),
    //     $lte: moment()
    //       .subtract(1, 'month')
    //       .subtract(1, 'day')
    //       .endOf('month')
    //       .toDate()
    //   }
    // })
    // const vinInInventories = await ActivityHistory.aggregate([
    //   {
    //     $match: {
    //       company: company._id,
    //       type: ChoicesTypeActivity.inventory,
    //       createdAt: {
    //         $gte: moment()
    //           // .subtract(1, 'month')
    //           .subtract(1, 'day')
    //           .startOf('month')
    //           .toDate(),
    //         $lte: moment()
    //           // .subtract(1, 'month')
    //           .subtract(1, 'day')
    //           .endOf('month')
    //           .toDate()
    //       }
    //     }
    //   },
    //   {
    //     $group: {
    //       _id: '$car'
    //     }
    //   },
    //   {
    //     $group: {
    //       _id: 1,
    //       count: {
    //         $sum: 1
    //       }
    //     }
    //   }
    // ]);
    return countInventoryCars //vinInInventories.length ? vinInInventories[0].count : 0;
  }

  private async calculateCarsInRequest(company: ICompany, start_date: moment.Moment, end_date: moment.Moment): Promise<number> {
    const countRequestsCars = await RequestItem.count({
      company: company._id,
      createdAt: {
        $gte: start_date
          .toDate(),
        $lte: end_date
          .toDate()
      }
    })

    // const vinInInventories = await RequestItem.aggregate([
    //   {
    //     $match: {
    //       company: company._id,
    //       createdAt: {
    //         $gte: moment()
    //           // .subtract(1, 'month')
    //           .subtract(1, 'day')
    //           .startOf('month')
    //           .toDate(),
    //         $lte: moment()
    //           // .subtract(1, 'month')
    //           .subtract(1, 'day')
    //           .endOf('month')
    //           .toDate()
    //       }
    //     }
    //   },
    //   {
    //     $group: {
    //       _id: '$_id'
    //     }
    //   },
    //   {
    //     $group: {
    //       _id: 1,
    //       count: {
    //         $sum: 1
    //       }
    //     }
    //   }
    // ]);
    return countRequestsCars // vinInInventories.length ? vinInInventories[0].count : 0;
  }

  public generateHTML(invoice: IInvoiceModel): string {
    moment.locale('es');
    moment.tz.setDefault('America/Santiago');
    const css = fs.readFileSync(
      `${path.join(__dirname, '../../../views/')}billing/pdf/style.css`,
      'utf8'
    );
    const templatePath: string = `${path.join(
      __dirname,
      '../../../views/'
    )}billing/pdf/index.pug`;
    return GeneralUtils.generateHtmlFromPugFile(templatePath, {
      css: css.replace(/(\r\n|\n|\r)/gm, ''),
      moment,
      invoice,
      jsUcfirst: (text: string) => text.charAt(0).toUpperCase() + text.slice(1)
    });
  }

  public async createPDF(
    invoice: IInvoiceModel,
    company: ICompany
  ): Promise<void> {
    try {
      const newInvoice = await Invoice.findById(invoice._id).populate([
        {
          path: 'company'
        },
        {
          path: 'team'
        }
      ]);
      if (newInvoice) {
        const filename = `invoice-${invoice._id}.pdf`;
        const path = `/tmp/${filename}`;
        // launch a new chrome instance
        const browser = await puppeteer.launch({
          executablePath: '/usr/bin/chromium',
          args: [
            '--no-sandbox',
            '--allow-file-access-from-files',
            '--enable-local-file-accesses'
          ], // Required.
          headless: true
        });

        // create a new page
        const page = await browser.newPage();

        await page.setContent(this.generateHTML(newInvoice), {
          waitUntil: 'networkidle0'
        });

        await page.pdf({
          path,
          format: 'Letter',
          printBackground: true,
          margin: {
            top: '0.3in',
            right: '0.5in',
            bottom: '0.3in',
            left: '0.5in'
          }
        });
        await browser.close();

        invoice.attach(
          'file',
          {
            originalname: filename,
            team: `${newInvoice.team._id} ${newInvoice.team.name}`,
            company: `${newInvoice.company._id} ${newInvoice.company.name}`,
            createdAt: moment(newInvoice.createdAt)
              .subtract(1, 'month')
              .format('YYYY-MM'),
            path
          },
          async (error: any) => {
            if (error) {
              /* istanbul ignore next */
              console.log(error);
            } else {
              invoice.file = invoice.file;
              await invoice.save();
              this.sendEmail(invoice, company);
            }
          }
        );
      }
    } catch (e) {
      // Raven.captureException(e);
      console.log(e.message);
    }
  }

  private sendEmail(invoice: IInvoiceModel, company: ICompany): void {
    const period = moment(invoice.createdAt)
      .subtract(1, 'month')
      .format('MMMM YYYY');
    for (const notification of company.notifications) {
      emailQueue.queue.add('email', {
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
      },  { attempts: 3, backoff: 1000, removeOnComplete: true });
    }
  }

  private calculateContainerTotal(containers: number){
    // Calculate the total price for a scale based price
    // 0 - 699 -> 1 Dollar
    // 700 - 1399 -> 0.95
    // 1400 - 1799 -> 0.93
    // 1800 - 5000 -> 0.92
    let sum = 0;
    let rest = containers;
    let prices = [
      {from: 0, to: 699, unitPrice: 1},
      {from: 700, to: 1399, unitPrice: 0.95},
      {from: 1400, to: 1999, unitPrice: 0.9},
    ]
    for (let price of prices) {
      let range = price.to - price.from;
      if (rest >= range ) {
        sum += (rest - price.from) * price.unitPrice;
      } else if ( rest > 0 && rest < range) {
        sum += rest * price.unitPrice;
        break;
      } else {
        break;
      }
    }
    console.log(sum)
    return sum;
  }

  public async processBilling(team?: any): Promise<void> {
    try {
      console.log('start billing');
      // const valueUF = 28662.81; /*await this.getUFPrice();*/
      // const valueDolar = 767.98; /*await this.getDolarPrice();*/
      const valueUF = await this.getUFPrice();
      const filter: any = {
        'billing.active': true
      };
      if (team) {
        filter.team = team;
      }
      let start_date = moment().subtract(15, 'days').startOf('month');
      let end_date = moment().subtract(15, 'days').endOf('month');
      const companies = await Company.find(filter);
      for (const company of companies) {
        const period = start_date.format('YYYYMM');
        console.log(`calculating billing ${company.name}`);
        if (company.handler) {
          console.log(`Calcuating billing for handler company`);
          let minPrice = 665;
          const containers = await this.calculateContainers(company, start_date, end_date);
          const valueDolar = await this.getDolarPrice();
          let containerPrice = containers < 700 ?
            minPrice :
            this.calculateContainerTotal(containers);
          const invoice = new Invoice({
            team: company.team,
            company,
            period,
            containers,
            containerPrice,
            valueDolar,
            totalDolar: containerPrice,
            totalPeso: containerPrice * valueDolar,
          });
          if (!(await Invoice.find({ company, period }).countDocuments())) {
            await invoice.save();
            // this.createPDF(invoice, company);
            console.log("Creado")
          } else {
            console.log(`${period} ${company.name} ya existe!!!.`);
          }
        } else {
          console.log(`Calcuating billing for company ${company.name}`);
          const inventoryCars = await this.calculateCarsInInventory(company, start_date, end_date);
          const checklistCars = await this.calculateCarsInChecklist(company, start_date, end_date);
          const requestCars = await this.calculateCarsInRequest(company, start_date, end_date);
          const deliveryCars = await this.calculateCarsInDelivery(company, start_date, end_date);
          const totalInventory = inventoryCars * company.billing.inventoryPrice;
          const totalChecklist = checklistCars * company.billing.checklistPrice;
          const totalDelivery = deliveryCars * company.billing.deliveryPrice;
          const totalRequest = requestCars * company.billing.requestPrice;
          const totalUF =
            totalInventory + totalChecklist + totalRequest + totalDelivery;

          const invoice = new Invoice({
            team: company.team,
            company,
            period,
            inventoryCars,
            checklistCars,
            deliveryCars,
            requestCars,
            inventoryPrice: company.billing.inventoryPrice,
            checklistPrice: company.billing.checklistPrice,
            requestPrice: company.billing.requestPrice,
            deliveryPrice: company.billing.deliveryPrice,
            totalUF,
            valueUF,
            // valueDolar,
            // totalDolar: (totalUF * valueUF) / valueDolar,
            totalPeso: totalUF * valueUF
          });
          if (!(await Invoice.find({ company, period }).countDocuments())) {
            await invoice.save();
            // this.createPDF(invoice, company);
            console.log("Creado")
          } else {
            console.log(`${period} ${company.name} ya existe!!!.`);
          }
        }
      }
    } catch (e) {
      console.log(e);
    }
  }
}

export default BillingQueue;
