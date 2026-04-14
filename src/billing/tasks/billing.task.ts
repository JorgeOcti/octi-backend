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
import * as console from 'console';
// import History from "../../app/models/history.model";
import Inventory from '../../inventory/models/inventory.model';
import InventoryCar from '../../inventory/models/inventoryCar.model';
import Form from '../../form/models/form.model';
import User from '../../app/models/user.model';

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
      console.log(`Getting dolar for ${day}-${month}-${year}`);
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
    return countCarChecklist; //vinInChecklist.length ? vinInChecklist[0].count : 0;
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
    });
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
    return countCarDelivery; //vinInDelivery.length ? vinInDelivery[0].count : 0;
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
      inventory: { $in: inventories.map(i => i._id) }
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
    return countInventoryCars; //vinInInventories.length ? vinInInventories[0].count : 0;
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
    });

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
    return countRequestsCars; // vinInInventories.length ? vinInInventories[0].count : 0;
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
      }, { attempts: 3, backoff: 1000, removeOnComplete: true });
    }
  }

  public async processBilling(team?: any): Promise<void> {
    try {
      console.log('========================================');
      console.log('START BILLING PROCESS');
      console.log('========================================');

      // Obtener el precio del dólar
      const valueDolar = await this.getDolarPrice();
      console.log(`Dólar price: ${valueDolar}`);


      // Definir precios en USD
      let GENERAL_CONTAINER_PRICE_USD = 0;
      let CODED_CONTAINER_PRICE_USD = 0;
      let CODED_CAR_PRICE_USD = 0;
      let GENERAL_CAR_PRICE_USD = 0;
      let AFORO_PRICE_USD = 0;
      console.log("TEAM:", team);

      if (team === "67aac5f594ed0a1f9da3478a") { // MEDLOG
        GENERAL_CONTAINER_PRICE_USD = 1;
        CODED_CONTAINER_PRICE_USD = 1;
        CODED_CAR_PRICE_USD = 1.69;
        GENERAL_CAR_PRICE_USD = 0;
        AFORO_PRICE_USD = 1;
      } else if (team === "695e913f69b679429eb335f7") { // CIS
        GENERAL_CONTAINER_PRICE_USD = 0.95;
        CODED_CONTAINER_PRICE_USD = 0.95;
        CODED_CAR_PRICE_USD = 1.27;
        GENERAL_CAR_PRICE_USD = 0;
        AFORO_PRICE_USD = 0.95;
      }


      // Configurar filtro para empresas con billing activo
      const filter: any = {
        'billing.active': true
      };
      if (team) {
        filter.team = team;
      }

      // Calcular período: mes anterior (restando 15 días y tomando inicio del mes)
      const start_date = moment().subtract(15, 'days').startOf('month');
      const end_date = moment().subtract(15, 'days').endOf('month');
      const period = start_date.format('YYYYMM');

      console.log(`Period: ${period}`);
      console.log(`Date range: ${start_date.format('YYYY-MM-DD')} to ${end_date.format('YYYY-MM-DD')}`);

      // Obtener empresas con facturación activa
      const companies = await Company.find(filter);
      console.log(`Found ${companies.length} companies with active billing`);

      for (const company of companies) {
        console.log('----------------------------------------');
        console.log(`Processing company: ${company.name} (${company._id})`);

        const osaUsers = await User.find({
          team: company.team,
          company: company._id,
          email: /@osacontrol.com$/
        });

        // Obtener todos los inventarios del período
        const allInventories = await Inventory.find({
          company: company._id,
          createdAt: {
            $gte: start_date.toDate(),
            $lte: end_date.toDate()
          }
        });

        console.log(`Found ${allInventories.length} total inventories for the period`);

        if (allInventories.length === 0) {
          console.log(`No inventories found for ${company.name}, skipping...`);
          continue;
        }

        // ==================================================
        // SEPARAR INVENTARIOS POR CONTENT TYPE
        // ==================================================
        const generalItemsInventories = allInventories.filter(i => (i as any).contentType === 'general-items');
        const codedItemsInventories = allInventories.filter(i => (i as any).contentType === 'coded-items');

        console.log(`  General-items inventories: ${generalItemsInventories.length}`);
        console.log(`  Coded-items inventories: ${codedItemsInventories.length}`);

        const generalInventoryIds = generalItemsInventories.map(i => i._id);
        const codedInventoryIds = codedItemsInventories.map(i => i._id);

        // ==================================================
        // GENERAL-ITEMS INVENTORY
        // ==================================================
        console.log('');
        console.log('>>> GENERAL-ITEMS INVENTORIES <<<');

        let generalContainerCount = 0;
        let generalCarCount = 0;

        if (generalInventoryIds.length > 0) {
          // Contenedores en general-items (container = null y car.isContainer = true)
          const generalContainerInventoryCars = await InventoryCar.find({
            inventory: { $in: generalInventoryIds },
            container: null,
            inventoriedBy: { $nin: osaUsers.map(u => u._id) }
          }).populate('car');

          const generalContainers = generalContainerInventoryCars.filter(ic =>
            ic.car && (ic.car as any).isContainer === true
          );
          generalContainerCount = generalContainers.length;
          const generalContainerIds = generalContainers.map(c => c._id);

          console.log(`  Containers: ${generalContainerCount}`);

          // Verificar si los contenedores en general-items tienen autos dentro (NO deberían)
          if (generalContainerIds.length > 0) {
            const carsInsideGeneralContainers = await InventoryCar.find({
              inventory: { $in: generalInventoryIds },
              container: { $in: generalContainerIds },
              inventoriedBy: { $nin: osaUsers.map(u => u._id) }
            }).populate('car');

            if (carsInsideGeneralContainers.length > 0) {
              console.log(`  ⚠️  WARNING: Found ${carsInsideGeneralContainers.length} cars INSIDE general-items containers (should be 0)`);
              for (const ic of carsInsideGeneralContainers) {
                console.log(`      - Car: ${(ic.car as any)?.vin || 'N/A'} in container ${ic.container}`);
              }
            } else {
              console.log(`  ✓ No cars inside general containers (correct)`);
            }
          }

          // Autos sueltos en general-items (container = null y car.isContainer = false)
          const generalCars = generalContainerInventoryCars.filter(ic =>
            ic.car && (ic.car as any).isContainer !== true
          );
          generalCarCount = generalCars.length;

          console.log(`  General cars (loose): ${generalCarCount}`);
        } else {
          console.log(`  No general-items inventories found`);
        }

        // ==================================================
        // CODED-ITEMS INVENTORY
        // ==================================================
        console.log('');
        console.log('>>> CODED-ITEMS INVENTORIES <<<');

        let codedContainerCount = 0;
        let codedCarCount = 0;

        if (codedInventoryIds.length > 0) {
          // Contenedores en coded-items (container = null y car.isContainer = true)
          const codedContainerInventoryCars = await InventoryCar.find({
            inventory: { $in: codedInventoryIds },
            container: null,
            inventoriedBy: { $nin: osaUsers.map(u => u._id) }
          }).populate('car');

          const codedContainers = codedContainerInventoryCars.filter(ic =>
            ic.car && (ic.car as any).isContainer === true
          );
          codedContainerCount = codedContainers.length;
          const codedContainerIds = codedContainers.map(c => c._id);

          console.log(`  Containers: ${codedContainerCount}`);

          // Autos dentro de contenedores en coded-items
          if (codedContainerIds.length > 0) {
            const carsInsideCodedContainers = await InventoryCar.find({
              inventory: { $in: codedInventoryIds },
              container: { $in: codedContainerIds },
              inventoriedBy: { $nin: osaUsers.map(u => u._id) }
            });
            codedCarCount = carsInsideCodedContainers.length;
          }

          console.log(`  Cars inside containers: ${codedCarCount}`);
        } else {
          console.log(`  No coded-items inventories found`);
        }


        // ==================================================
        // AFORO FORMS
        // ==================================================
        console.log('');
        console.log('>>> AFORO FORMS <<<');

        let aforoCount = 0;

        let detail: any = {
          desconsolidado: {
            containers: { count: generalContainerCount + codedContainerCount, price: (generalContainerCount + codedContainerCount) * GENERAL_CONTAINER_PRICE_USD },
            codedUnits: { count: generalCarCount + codedCarCount, price: (generalCarCount + codedCarCount) * CODED_CAR_PRICE_USD }
          }
        };
        let aforoDetail: any = {};

        // Buscar formularios con kind 'aforo' o 'aforoSAG' para esta company/team
        for (const aforoKind of ['aforo', 'aforoSAG']) {
          const aforoForms = await Form.find({
            company: company._id,
            team: company.team,
            kind: aforoKind
          });
          const aforoFormIds = aforoForms.map(f => f._id);

          console.log(`  Found ${aforoForms.length} aforo forms (aforo/aforoSAG)`);

          if (aforoFormIds.length > 0) {
            // Buscar participants asociados a esos formularios en el rango de fechas
            const count = await Participant.countDocuments({
              form: { $in: aforoFormIds },
              company: company._id,
              user: { $nin: osaUsers.map(u => u._id) },
              createdAt: {
                $gte: start_date.toDate(),
                $lte: end_date.toDate()
              }
            });
            aforoCount += count;
            console.log(`  Aforo participants in period: ${count} for ${aforoKind}`);
            if (count > 0) {
              aforoDetail[aforoKind] = { count, price: AFORO_PRICE_USD * count };
            }
          } else {
            console.log(`  No aforo forms found for this company`);
          }
        }

        if (Object.keys(aforoDetail).length > 0) {
          console.log(`  Aforo participants in period: ${JSON.stringify(aforoDetail)}`);
          detail.aforo = aforoDetail;
        }


        // ==================================================
        // CÁLCULO DE TOTALES
        // ==================================================
        const totalContainers = generalContainerCount + codedContainerCount + aforoCount;
        const totalCars = generalCarCount + codedCarCount; // general cars suele ser 0

        const generalContainerTotalUSD = generalContainerCount * GENERAL_CONTAINER_PRICE_USD;
        const generalCarTotalUSD = generalCarCount * GENERAL_CAR_PRICE_USD;
        const codedContainerTotalUSD = codedContainerCount * CODED_CONTAINER_PRICE_USD;
        const codedCarTotalUSD = codedCarCount * CODED_CAR_PRICE_USD;
        const aforoTotalUSD = aforoCount * AFORO_PRICE_USD;

        const totalUSD = generalContainerTotalUSD + generalCarTotalUSD + codedContainerTotalUSD + codedCarTotalUSD + aforoTotalUSD;
        const totalCLP = totalUSD * valueDolar;

        console.log('');
        console.log('========== BILLING SUMMARY ==========');
        console.log('GENERAL-ITEMS:');
        console.log(`  Containers: ${generalContainerCount} x $${GENERAL_CONTAINER_PRICE_USD} = $${generalContainerTotalUSD.toFixed(2)} USD`);
        console.log(`  Cars (loose): ${generalCarCount} x $${GENERAL_CAR_PRICE_USD} = $${generalCarTotalUSD.toFixed(2)} USD`);
        console.log('CODED-ITEMS:');
        console.log(`  Containers: ${codedContainerCount} x $${CODED_CONTAINER_PRICE_USD} = $${codedContainerTotalUSD.toFixed(2)} USD`);
        console.log(`  Cars (inside containers): ${codedCarCount} x $${CODED_CAR_PRICE_USD} = $${codedCarTotalUSD.toFixed(2)} USD`);
        console.log('AFOROS:');
        console.log(`  Aforo participants: ${aforoCount} x $${AFORO_PRICE_USD} = $${aforoTotalUSD.toFixed(2)} USD`);
        console.log('---');
        console.log(`  TOTAL CONTAINERS (general + coded + aforos): ${totalContainers}`);
        console.log(`  TOTAL CARS (general loose + coded inside): ${totalCars}`);
        console.log(`  TOTAL: $${totalUSD.toFixed(2)} USD`);
        console.log(`  TOTAL: $${totalCLP.toFixed(2)} CLP (rate: ${valueDolar})`);
        console.log('=====================================');

        // ==================================================
        // GUARDAR INVOICE
        // ==================================================
        const invoice = new Invoice({
          team: company.team,
          company: company._id,
          period,
          // Containers incluye: general + coded + aforos
          containers: totalContainers,
          // Cars incluye: general sueltos + coded dentro de containers
          inventoryCars: totalCars,
          // Totals
          valueDolar,
          totalDolar: totalUSD,
          totalPeso: totalCLP,
          detail
        });

        if (!(await Invoice.find({ company: company._id, period }).countDocuments())) {
          await invoice.save();
          console.log(`Invoice created for ${company.name}`);
        } else {
          console.log(`Invoice for ${period} ${company.name} already exists!`);
        }

        console.log(`[COMMENTED] Invoice creation skipped (uncomment to activate)`);
      }

      console.log('========================================');
      console.log('BILLING PROCESS COMPLETED');
      console.log('========================================');
    } catch (e) {
      console.log('ERROR in processBilling:');
      console.log(e);
    }
  }
}

export default BillingQueue;
