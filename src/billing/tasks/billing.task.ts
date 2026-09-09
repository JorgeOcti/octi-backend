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
import InventoryCar, { ChoicesStatusContainer } from '../../inventory/models/inventoryCar.model';
import { ChoicesStatusCarInventory } from '../../app/models/inventoryCar.types';
import Form from '../../form/models/form.model';
import User from '../../app/models/user.model';

const MEDLOG_TEAM_ID = '67aac5f594ed0a1f9da3478a';
const CIS_TEAM_ID = '695e913f69b679429eb335f7';

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
      const now = moment(); // .subtract(1, 'day')
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
                JSON.parse(body).Dolares[0].Valor.replace('.', '').replace(',', '.')
              )
            );
          }
        }
      );
    });
  }

  /**
   * CIS no factura los contenedores que nunca se trabajaron, es decir los que
   * siguen con `status` pending Y `containerStatus` pending (ambos son el valor
   * por defecto del modelo). Un contenedor así se factura recién en el período
   * en que se abre, porque el período se acota por `updatedAt`.
   *
   * Los autos dentro de un contenedor excluido tampoco se facturan: la misma
   * regla se evalúa sobre el contenedor padre de cada unidad.
   *
   * Para el resto de los teams (MEDLOG, etc.) se factura todo contenedor
   * inventariado, sin mirar el status.
   */
  private isBillableContainer(inventoryCar: any, isCIS: boolean): boolean {
    if (!isCIS) {
      return true;
    }
    return !(
      inventoryCar.status === ChoicesStatusCarInventory.pending &&
      inventoryCar.containerStatus === ChoicesStatusContainer.pending
    );
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

  /**
   * @param team    Team a facturar. Si no se pasa, no hay tarifas configuradas
   *                y todo queda en 0 (ver el WARNING más abajo).
   * @param options dryRun: calcula y loguea todo pero NO guarda el invoice.
   *                period: fuerza el período en formato YYYYMM. Sin esto el
   *                período se deriva de la fecha de corrida, que depende del día
   *                en que se ejecuta (`subtract(25, 'days')`): el 26 de agosto
   *                apunta a agosto, el 15 de agosto apunta a julio.
   */
  public async processBilling(
    team?: any,
    options: { dryRun?: boolean; period?: string } = {}
  ): Promise<void> {
    try {
      const dryRun = options.dryRun === true;

      console.log('========================================');
      console.log(`START BILLING PROCESS${dryRun ? ' (DRY-RUN: no se guarda nada)' : ''}`);
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

      // `team` llega como ObjectId cuando se invoca desde el controller
      // (req.user.team._id), por lo que comparar con === contra un string
      // siempre daba false y todos los precios quedaban en 0.
      const teamId = team ? String(team) : '';
      const isCIS = teamId === CIS_TEAM_ID;
      console.log("TEAM:", teamId || '(sin team)');

      if (teamId === MEDLOG_TEAM_ID) { // MEDLOG
        GENERAL_CONTAINER_PRICE_USD = 0.95;
        CODED_CONTAINER_PRICE_USD = 0.95;
        CODED_CAR_PRICE_USD = 1.27;
        GENERAL_CAR_PRICE_USD = 0;
        AFORO_PRICE_USD = 0.95;
      } else if (teamId === CIS_TEAM_ID) { // CIS
        GENERAL_CONTAINER_PRICE_USD = 0.95;
        CODED_CONTAINER_PRICE_USD = 0.95;
        CODED_CAR_PRICE_USD = 1.27;
        GENERAL_CAR_PRICE_USD = 0;
        AFORO_PRICE_USD = 0.95;
      } else {
        console.log(
          `WARNING: no hay tarifas configuradas para el team "${teamId || '(sin team)'}". ` +
          `Todos los precios quedan en 0 y el invoice se generará con total 0.`
        );
      }


      // Configurar filtro para empresas con billing activo
      const filter: any = {
        'billing.active': true
      };
      if (team) {
        filter.team = team;
      }

      // Calcular período. Por defecto se deriva de la fecha de corrida
      // (restando 25 días y tomando el mes de esa fecha), que es lo que hace el
      // cron del día 1. OJO: corrido a mano a fin de mes apunta al mes EN CURSO,
      // no al anterior. `options.period` (YYYYMM) permite fijarlo explícitamente.
      const periodBase = options.period
        ? moment(options.period, 'YYYYMM', true)
        : moment().subtract(25, 'days');

      if (options.period && !periodBase.isValid()) {
        throw new Error(`Período inválido: "${options.period}". Formato esperado YYYYMM (ej: 202607).`);
      }

      const start_date = periodBase.clone().startOf('month');
      const end_date = periodBase.clone().endOf('month');
      const period = start_date.format('YYYYMM');

      console.log(`Period: ${period}`);
      console.log(`Date range: ${start_date.format('YYYY-MM-DD')} to ${end_date.format('YYYY-MM-DD')}`);

      // Obtener empresas con facturación activa
      const companies = await Company.find(filter);
      console.log(`Found ${companies.length} companies with active billing`);

      // Solo se llena en dry-run: se vuelca a un JSON al final para poder
      // revisar el detalle (BIC / VIN) sin escribir nada en la base.
      const dryRunSummary: any[] = [];

      for (const company of companies) {
        console.log('----------------------------------------');
        console.log(`Processing company: ${company.name} (${company._id})`);

        const osaUsers = await User.find({
          team: company.team,
          company: company._id,
          email: /@octimize.cl$/
        });

        // Rango del período aplicado sobre el `updatedAt` de cada inventoryCar.
        //
        // Antes el período se filtraba por la fecha de creación del INVENTARIO,
        // lo que dejaba dos huecos: un inventario creado en un mes anterior no
        // facturaba nada de lo trabajado este mes, y un inventario creado este
        // mes facturaba también lo que se trabajara en los meses siguientes.
        //
        // Se usa `updatedAt` (no `createdAt`) porque un contenedor se carga con
        // el manifiesto y puede abrirse recién en un período posterior: se
        // factura en el período en que efectivamente se trabajó.
        const periodRange = {
          $gte: start_date.toDate(),
          $lte: end_date.toDate()
        };

        // Todos los inventarios de la company, sin filtro de fecha: el período
        // se acota por inventoryCar, no por el inventario.
        const allInventories = await Inventory.find({
          company: company._id
        });

        console.log(`Found ${allInventories.length} total inventories for the company`);

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
        const containerItems: any[] = [];
        const unitItems: any[] = [];

        if (generalInventoryIds.length > 0) {
          // Contenedores en general-items (container = null y car.isContainer = true)
          // trabajados dentro del período (updatedAt)
          const generalContainerInventoryCars = await InventoryCar.find({
            inventory: { $in: generalInventoryIds },
            container: null,
            updatedAt: periodRange,
            inventoriedBy: { $nin: osaUsers.map(u => u._id) }
          }).populate('car');

          const allGeneralContainers = generalContainerInventoryCars.filter(ic =>
            ic.car && (ic.car as any).isContainer === true
          );
          // CIS: se descartan los contenedores pending/pending (nunca trabajados)
          const generalContainers = allGeneralContainers.filter(ic =>
            this.isBillableContainer(ic, isCIS)
          );
          generalContainerCount = generalContainers.length;
          const generalContainerIds = allGeneralContainers.map(c => c._id);

          const generalSkippedByStatus = allGeneralContainers.length - generalContainers.length;
          console.log(`  Containers: ${generalContainerCount}`);
          if (generalSkippedByStatus > 0) {
            console.log(`    (${generalSkippedByStatus} contenedores excluidos por status pending/pending - regla CIS)`);
          }

          for (const ic of generalContainers) {
            const extra = (ic as any).extra || {};
            containerItems.push({
              action: 'desconsolidado',
              kind: 'container',
              bic: (ic.car as any)?.vin,
              carId: (ic.car as any)?._id,
              inventoryCarId: ic._id,
              inventoryId: ic.inventory,
              contentType: 'general-items',
              nave: extra['Nave'] || '',
              viaje: extra['N° Viaje'] || '',
              datetime: (ic as any).updatedAt,
              price: GENERAL_CONTAINER_PRICE_USD
            });
          }

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

          for (const ic of generalCars) {
            const extra = (ic as any).extra || {};
            unitItems.push({
              action: 'desconsolidado',
              kind: 'generalUnit',
              vin: (ic.car as any)?.vin,
              carId: (ic.car as any)?._id,
              inventoryCarId: ic._id,
              inventoryId: ic.inventory,
              contentType: 'general-items',
              nave: extra['Nave'] || '',
              viaje: extra['N° Viaje'] || '',
              datetime: (ic as any).updatedAt,
              price: GENERAL_CAR_PRICE_USD
            });
          }

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
          // trabajados dentro del período (updatedAt)
          const codedContainerInventoryCars = await InventoryCar.find({
            inventory: { $in: codedInventoryIds },
            container: null,
            updatedAt: periodRange,
            inventoriedBy: { $nin: osaUsers.map(u => u._id) }
          }).populate('car');

          const allCodedContainers = codedContainerInventoryCars.filter(ic =>
            ic.car && (ic.car as any).isContainer === true
          );
          // CIS: se descartan los contenedores pending/pending (nunca trabajados).
          // Los autos dentro de esos contenedores tampoco se cuentan: la regla se
          // vuelve a aplicar más abajo sobre el contenedor padre de cada unidad.
          const codedContainers = allCodedContainers.filter(ic =>
            this.isBillableContainer(ic, isCIS)
          );
          codedContainerCount = codedContainers.length;

          const codedSkippedByStatus = allCodedContainers.length - codedContainers.length;
          console.log(`  Containers: ${codedContainerCount}`);
          if (codedSkippedByStatus > 0) {
            console.log(`    (${codedSkippedByStatus} contenedores excluidos por status pending/pending - regla CIS, sus autos tampoco se cuentan)`);
          }

          for (const ic of codedContainers) {
            const extra = (ic as any).extra || {};
            containerItems.push({
              action: 'desconsolidado',
              kind: 'container',
              bic: (ic.car as any)?.vin,
              carId: (ic.car as any)?._id,
              inventoryCarId: ic._id,
              inventoryId: ic.inventory,
              contentType: 'coded-items',
              nave: extra['Nave'] || '',
              viaje: extra['N° Viaje'] || '',
              datetime: (ic as any).updatedAt,
              price: CODED_CONTAINER_PRICE_USD
            });
          }

          // Autos dentro de contenedores en coded-items, trabajados dentro del
          // período (updatedAt). A propósito NO se acotan a los contenedores
          // facturados arriba: el contenedor padre pudo haberse trabajado en otro
          // período (se abre un mes y se termina de desconsolidar el siguiente),
          // y si se acotaran, esas unidades no se facturarían nunca.
          const unitsInPeriod = await InventoryCar.find({
            inventory: { $in: codedInventoryIds },
            container: { $ne: null },
            updatedAt: periodRange,
            inventoriedBy: { $nin: osaUsers.map(u => u._id) }
          }).populate('car');

          if (unitsInPeriod.length > 0) {
            // Resolver el contenedor padre de cada unidad para aplicar la regla
            // CIS: las unidades de un contenedor excluido no se facturan.
            const parentIds = [...new Set(unitsInPeriod.map(u => String(u.container)))];
            const parentContainers = await InventoryCar.find({
              _id: { $in: parentIds }
            }, { status: 1, containerStatus: 1 });

            const billableParentIds = new Set(
              parentContainers
                .filter(p => this.isBillableContainer(p, isCIS))
                .map(p => String(p._id))
            );

            const carsInsideCodedContainers = unitsInPeriod.filter(u =>
              billableParentIds.has(String(u.container))
            );
            codedCarCount = carsInsideCodedContainers.length;

            const unitsSkippedByParent = unitsInPeriod.length - carsInsideCodedContainers.length;
            if (unitsSkippedByParent > 0) {
              console.log(`    (${unitsSkippedByParent} autos excluidos porque su contenedor no es facturable - regla CIS)`);
            }

            for (const ic of carsInsideCodedContainers) {
              const extra = (ic as any).extra || {};
              unitItems.push({
                action: 'desconsolidado',
                kind: 'codedUnit',
                vin: (ic.car as any)?.vin,
                carId: (ic.car as any)?._id,
                inventoryCarId: ic._id,
                inventoryId: ic.inventory,
                containerCarId: ic.container,
                contentType: 'coded-items',
                nave: extra['Nave'] || '',
                viaje: extra['N° Viaje'] || '',
                datetime: (ic as any).updatedAt,
                price: CODED_CAR_PRICE_USD
              });
            }
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

        const detail: any = {
          desconsolidado: {
            containers: {
              count: generalContainerCount + codedContainerCount,
              price: (generalContainerCount + codedContainerCount) * GENERAL_CONTAINER_PRICE_USD,
              items: containerItems
            },
            codedUnits: {
              count: generalCarCount + codedCarCount,
              price: (generalCarCount + codedCarCount) * CODED_CAR_PRICE_USD,
              items: unitItems
            }
          }
        };
        const aforoDetail: any = {};

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
            const participants = await Participant.find({
              form: { $in: aforoFormIds },
              company: company._id,
              user: { $nin: osaUsers.map(u => u._id) },
              createdAt: {
                $gte: start_date.toDate(),
                $lte: end_date.toDate()
              }
            }).populate('car');
            const count = participants.length;
            aforoCount += count;
            console.log(`  Aforo participants in period: ${count} for ${aforoKind}`);
            if (count > 0) {
              const aforoItems = participants.map((p: any) => ({
                action: aforoKind,
                kind: aforoKind,
                vin: p.car?.vin,
                carId: p.car?._id,
                participantId: p._id,
                formId: p.form,
                // Aforo revision time: when the participant/review was submitted
                datetime: p.createdAt,
                price: AFORO_PRICE_USD
              }));
              aforoDetail[aforoKind] = {
                count,
                price: AFORO_PRICE_USD * count,
                items: aforoItems
              };
            }
          } else {
            console.log(`  No aforo forms found for this company`);
          }
        }

        if (Object.keys(aforoDetail).length > 0) {
          console.log(`  Aforo participants in period: ${Object.keys(aforoDetail).join(', ')}`);
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

        const existing = await Invoice.find({ company: company._id, period }).countDocuments();

        if (dryRun) {
          console.log(
            `DRY-RUN: NO se guarda el invoice de ${company.name} (período ${period}). ` +
            `${existing ? `Ya existe un invoice para este período.` : `No existe invoice para este período.`}`
          );
          dryRunSummary.push({
            company: company.name,
            companyId: String(company._id),
            period,
            containers: totalContainers,
            inventoryCars: totalCars,
            valueDolar,
            totalDolar: totalUSD,
            totalPeso: totalCLP,
            invoiceAlreadyExists: existing > 0,
            detail
          });
        } else if (!existing) {
          await invoice.save();
          console.log(`Invoice created for ${company.name}`);
        } else {
          console.log(`Invoice for ${period} ${company.name} already exists!`);
        }
      }

      if (dryRun) {
        const outPath = `/tmp/billing-dryrun-${teamId || 'no-team'}-${period}.json`;
        fs.writeFileSync(outPath, JSON.stringify(dryRunSummary, null, 2));
        console.log('');
        console.log(`DRY-RUN: detalle completo escrito en ${outPath}`);
        console.log(`DRY-RUN: ${dryRunSummary.length} companies procesadas, 0 invoices guardados`);
      }

      console.log('========================================');
      console.log(`BILLING PROCESS COMPLETED${dryRun ? ' (DRY-RUN)' : ''}`);
      console.log('========================================');
    } catch (e) {
      console.log('ERROR in processBilling:');
      console.log(e);
    }
  }
}

export default BillingQueue;
