import * as excel from 'exceljs';
import * as moment from 'moment-timezone';
import * as tempfile from 'tempfile';

import Invoice, { IInvoiceModel } from '../models/invoice.model';
import { PaginateOptions, PaginateResult } from 'mongoose';
import { Request, Response } from 'express';

import ActivityHistory from '../models/activityHistory.model';
import BillingQueue from '../tasks/billing.task';
import BillingTeamQueue from "../tasks/billingTeam.task";
import { ChoicesTypeActivity } from '../models/activiHistory.types';
import Company from '../../app/models/company.model';
import Form from '../../form/models/form.model';
import History from '../../app/models/history.model';
import { IRequest } from '../../interfaces/global.interface';
import InvoiceTeamBilling from "../models/invoiceTeamBilling.module";
import Module from '../models/module.model';
import Submodule from '../models/submodule.model';
import TeamBilling from "../models/teamBilling.model";
import logger from '../../services/logger.service';
import puppeteer from 'puppeteer';

class BillingController {

  readonly submodule: any;

  constructor() {
    this.index = this.index.bind(this);
    this.apiList = this.apiList.bind(this);
    this.apiDetail = this.apiDetail.bind(this);
    this.pdf = this.pdf.bind(this);
    this.run = this.run.bind(this);
    this.apiCurrentPeriod = this.apiCurrentPeriod.bind(this);
    this.getInvoiceCorporative = this.getInvoiceCorporative.bind(this);
    this.getOldestInvoiceCorporative = this.getOldestInvoiceCorporative.bind(this);
    this.getLastInvoiceCorporative = this.getLastInvoiceCorporative.bind(this);
    this.coportarePdf = this.coportarePdf.bind(this);
    this.apiInvoiceCorporative = this.apiInvoiceCorporative.bind(this);
    this.apiListCorporateBilling = this.apiListCorporateBilling.bind(this);
    this.apiListCompaniesCorporateBilling = this.apiListCompaniesCorporateBilling.bind(this);
    this.getCompaniesCorporateBilling = this.getCompaniesCorporateBilling.bind(this);
    this.getModules = this.getModules.bind(this);
    this.apiListModules = this.apiListModules.bind(this);
    this.exportDetail = this.exportDetail.bind(this);
    this.exportInvoiceDetail = this.exportInvoiceDetail.bind(this);
    this.submodule = new Submodule()
  }

  /* istanbul ignore next */
  public index(req: Request, res: Response): void {
    res.render('app/index');
  }

  public async pdf(req: IRequest, res: Response) {
    const { id } = req.params;
    const { debug } = req.query as { debug: string };
    try {
      const invoice = await Invoice.findById(id).populate([{ path: 'company' }]);
      if (invoice) {
        const billing = new BillingQueue();
        const html = billing.generateHTML(invoice);
        // new BillingQueue().createPDF(invoice);
        if (debug) {
          return res.send(html);
        } else {
          const browser = await puppeteer.launch({
            executablePath: '/usr/bin/chromium',
            args: ['--no-sandbox', '--allow-file-access-from-files', '--enable-local-file-accesses'], // Required.
            headless: true,
          })
          // create a new page
          const page = await browser.newPage();

          await page.setContent(html, {
            waitUntil: 'networkidle0'
          })

          const pdfBuffer = await page.pdf({
            format: 'Letter',
            printBackground: true,
            margin: {
              top: '0.3in',
              right: '0.5in',
              bottom: '0.3in',
              left: '0.5in'
            }
          })
          await browser.close();

          // Return Buffer
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-disposition', `inline; filename=${invoice._id.toString()}.pdf`);
          return res.send(pdfBuffer);
        }
      } else {
        return res.status(400).json({
          message: 'Invoice no encontrado.'
        });
      }
    } catch (e) {
      return res.status(500).json(e);
    }
  }

  public async coportarePdf(req: IRequest, res: Response) {
    const { id } = req.params;
    const { debug } = req.query as { debug: string };
    try {
      const invoice = await InvoiceTeamBilling.findById(id).populate({
        path: 'companies.company',
        select: ['_id', 'name']
      });
      // console.log(invoice);
      if (invoice) {
        const billing = new BillingTeamQueue();
        const html = billing.generateHTML(invoice);
        // new BillingQueue().createPDF(invoice);
        if (debug) {
          return res.send(html);
        } else {
          const browser = await puppeteer.launch({
            executablePath: '/usr/bin/chromium',
            args: ['--no-sandbox', '--allow-file-access-from-files', '--enable-local-file-accesses'], // Required.
            headless: true,
          })
          // create a new page
          const page = await browser.newPage();

          await page.setContent(html, {
            waitUntil: 'networkidle0'
          })

          const pdfBuffer = await page.pdf({
            format: 'Letter',
            printBackground: true,
            margin: {
              top: '0.3in',
              right: '0.5in',
              bottom: '0.3in',
              left: '0.5in'
            }
          })
          await browser.close();

          // Return Buffer
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-disposition', `inline; filename=${invoice._id.toString()}.pdf`);
          return res.send(pdfBuffer);
        }
      } else {
        return res.status(400).json({
          message: 'Invoice no encontrado.'
        });
      }
    } catch (e) {
      return res.status(500).json(e);
    }
  }

  public async apiDetail(req: IRequest, res: Response) {

    const { company } = req.user;
    try {
      /* generate file */
      const workbook = new excel.Workbook();
      const worksheet = workbook.addWorksheet('Usuarios', {
        properties: {
          // defaultRowHeight: 30
        }, pageSetup: {
          fitToPage: true, fitToHeight: 100, fitToWidth: 1
        }
      });
      worksheet.autoFilter = { from: 'A1', to: 'F1' };
      const columns: any[] = [{
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

      const activities = await ActivityHistory.find({
        company,
        type: ChoicesTypeActivity.inventory,
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
      const rows: any[] = [];
      for (const activity of activities) {
        // console.log(activity);
        rows.push({
          vin: activity.car!.vin,
          inventory: activity.inventory!.name,
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
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: 'Ha ocurrido un error. Comunicate con soporte para que te ayudemos a solucionarlo.'
      });
    }
  }

  public async apiList(req: IRequest, res: Response) {
    const { company } = req.user;
    const team = req.user.team._id;
    const { page, pageSize } = req.query as { page: string, pageSize: string };
    const options: PaginateOptions = {
      populate: [{
        path: 'company',
        select: ['_id', 'name', 'businessName', 'rut']
      }],
      sort: {
        _id: -1
      },
      customLabels: {
        totalDocs: 'total',
        docs: 'docs',
        limit: 'perPage',
        page: 'currentPage',
        nextPage: 'next',
        prevPage: 'prev',
        totalPages: 'pages',
        pagingCounter: 'si'
      },
      // allowDiskUse: true,
      lean: true,
      page: parseInt(page ? page : '1', 10),
      limit: parseInt(pageSize ? pageSize : '20', 10)
    };
    try {
      const filter = req.user.isAdmin ? { team } : { company };
      const invoices = await this.getInvoices(filter, options);
      if (options.page && invoices.pages && invoices.pages < options.page) {
        return res.status(400).json({
          message: 'La página solicitada no existe.',
          status: 400
        });
      } else {
        return res.json({
          count: invoices.total,
          pages: invoices.pages,
          hasPrevious: invoices.hasPrevious,
          hasNextPage: invoices.hasNextPage,
          results: invoices.docs,
          status: 200
        });
      }
    } catch (e) {
      /* istanbul ignore next  */
      return res.status(500).json(e);
    }
  }

  private getCompaniesCorporateBilling(filter: any, options: PaginateOptions) {
    return Company.aggregate([{
      $lookup: {
        from: 'teams',
        localField: 'team',
        foreignField: '_id',
        as: 'team'
      }
    }, {
      $unwind: { path: '$team', preserveNullAndEmptyArrays: true }
    }, {
      $project: {
        _id: 1,
        name: 1,
        team: {
          _id: 1,
          name: 1
        }
      }
    }, {
      $sort: {
        'team.name': 1,
        'name': 1,
      }
    }])

  }

  public async apiListCompaniesCorporateBilling(req: IRequest, res: Response) {
    try {
      return res.json({
        results: await this.getCompaniesCorporateBilling({}, {})
      }
      );
    } catch (e) {
      /* istanbul ignore next  */
      return res.status(500).json(e);
    }
  }

  private getModules(filter: any, options: PaginateOptions) {
    return Module
      .aggregate([{
        $lookup: {
          from: 'submodules',
          localField: '_id',
          foreignField: 'module',
          as: 'subModules'
        }
      }, {
        $project: {
          _id: 1,
          name: 1,
          subModules: {
            _id: 1,
            name: 1
          }
        }
      }]);
  }

  public async apiListModules(req: IRequest, res: Response) {
    try {
      return res.json({
        results: await this.getModules({}, {})
      }
      );
    } catch (e) {
      /* istanbul ignore next  */
      return res.status(500).json(e);
    }
  }

  public async apiListCorporateBilling(req: IRequest, res: Response) {
    try {
      const { team } = req.user;
      const teamBiling = await TeamBilling.findOneOrCreate({
        team: team._id
      }, {
        team: team._id,
        companies: [],
        modules: [],
        notifications: [],
      });
      return res.json({
        results: teamBiling
      });
    } catch (e) {
      /* istanbul ignore next  */
      return res.status(500).json(e);
    }
  }

  public async apiPatchCorporateBilling(req: IRequest, res: Response) {
    try {
      const { team } = req.user;
      const { businessName, modules, notifications, companies, name, rut, baseCost, textBaseCost } = req.body;
      const teamBilling = await TeamBilling.findOneAndUpdate({
        team: team._id
      }, {
        $set: {
          name,
          businessName,
          rut,
          baseCost,
          textBaseCost,
          companies,
          notifications,
          modules,
        }
      }, { new: true });
      return res.json(teamBilling);
    } catch (e) {
      /* istanbul ignore next  */
      return res.status(500).json(e);
    }
  }

  private getOldestInvoiceCorporative(filter: any) {
    return InvoiceTeamBilling
      .findOne(filter)
      .sort({ createdAt: 1 })
  }

  private getLastInvoiceCorporative(filter: any) {
    return InvoiceTeamBilling
      .findOne(filter)
      .sort({ createdAt: -1 })
  }

  private getInvoiceCorporative(filter: any) {
    return InvoiceTeamBilling
      .findOne(filter, {
        "realDolar": true,
        "teamBilling": true,
        "totalDolar": true,
        "total": true,
        "totalUF": true,
        "totalPeso": true,
        "valueUF": true,
        "valueDolar": true,
        "_id": true,
        "team": true,
        "period": true,
        "companies": true,
      })
      .populate({
        path: 'companies.company',
        select: ['_id', 'name']
      })
      .sort({ createdAt: -1 });
  }

  public async apiInvoiceCorporative(req: IRequest, res: Response) {
    try {
      const { team } = req.user;
      const { period } = req.query as { period: string };
      let filter: any = { team: team._id };
      if (period) {
        filter = { ...filter, period };
      }
      const oldestInvoice = await this.getOldestInvoiceCorporative({ team: team._id });
      const lastInvoice = await this.getLastInvoiceCorporative({ team: team._id });
      return res.json({
        results: await this.getInvoiceCorporative(filter),
        oldestInvoice: oldestInvoice?.period,
        lastInvoice: lastInvoice?.period
      });
    } catch (e) {
      console.log(e);
      /* istanbul ignore next  */
      return res.status(500).json(e);
    }
  }

  public async exportDetail(req: IRequest, res: Response): Promise<any> {
    try {
      const { period } = req.query;
      const { team } = req.user;
      logger.info(`CarController.exportParticipants email: ${req.user.email}`);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=billing-${period}.xlsx`);
      // Create Excel Stream with pipe to response object
      const options = {
        stream: res,
        useStyles: true,
        useSharedStrings: true
      };
      const workbook = new excel.stream.xlsx.WorkbookWriter(options);

      // Create columns/headers for excel
      let columns = [{
        header: 'Fecha', key: 'createdAt', width: 30, style: {
          numFmt: 'dd/mm/yyyy hh:mm'
        }
      }, {
        header: 'VIN', key: 'vin', width: 30
      }, {
        header: 'Empresa', key: 'company', width: 30
      }, {
        header: 'Aplicación', key: 'app', width: 30
      }, {
        header: 'Formulario', key: 'form', width: 30
      }, {
        header: 'Usuario', key: 'user', width: 30
      }];

      const worksheet = workbook.addWorksheet('Detalle Billing', {
        pageSetup: {
          fitToPage: true, fitToHeight: 100, fitToWidth: 1
        }
      });
      worksheet.columns = columns;

      // Create Mongo Query in Cursor/Stream Mode for all the participants/answers
      const invoices = await InvoiceTeamBilling.findOne({
        team: team._id,
        period
      }, { histories: true });
      if (invoices) {
        const cursor = History.aggregate([{
          $match: {
            _id: { $in: invoices.histories },
            // company: {
            //   $in: [
            //     new ObjectID('5b8da01ea9683b0bd74fcc53'), // Dercomaq
            //     new ObjectID('5bc88d87a9683ba58c197c24'), // IMCRUZ
            //     new ObjectID('5b17f8f0346a450658b5721e'), // Derco
            //     new ObjectID('5c1a80f84fba86565186a757') // Dercocenter
            //   ]
            // },
            module: { $nin: ['import'] },
            // executedAt: {
            //   $gte: new Date('2022-08-01T00:00:00.000Z' ),
            //   $lte: new Date( '2022-08-28T00:00:00.000Z' )
            // }
          }
        }, {
          $lookup: {
            from: 'cars',
            localField: 'car',
            foreignField: '_id',
            as: 'car'
          }
        }, {
          $unwind: { path: '$car', preserveNullAndEmptyArrays: true }
        }, {
          $lookup: {
            from: 'companies',
            localField: 'company',
            foreignField: '_id',
            as: 'company'
          }
        }, {
          $unwind: { path: '$company', preserveNullAndEmptyArrays: true }
        }, {
          $lookup: {
            from: 'participants',
            localField: 'participant',
            foreignField: '_id',
            as: 'participant'
          }
        }, {
          $unwind: { path: '$participant', preserveNullAndEmptyArrays: true }
        }, {
          $lookup: {
            from: 'users',
            localField: 'createdBy',
            foreignField: '_id',
            as: 'user'
          }
        }, {
          $unwind: { path: '$user', preserveNullAndEmptyArrays: true }
        }]).cursor()

        for await (const history of cursor) {
          worksheet.addRow({
            createdAt: moment(history.executedAt).toDate(),
            vin: history.car.vin,
            app: history.module,
            form: history?.participant?.name,
            company: history?.company.name,
            user: history?.user?.email
          }).commit();
        }

        cursor.close();
        workbook.commit();

        // code to handle connection abort or finish of data send
        req.connection.on('close', async () => {
          cursor.close();
        });
      } else {
        return res.status(404).json({ message: 'No se encontró el periodo solicitado' });
      }
    } catch (e) {
      logger.error(e);
    }
  }

  public async exportInvoiceDetail(req: IRequest, res: Response): Promise<any> {
    try {
      const { id } = req.params;
      logger.info(`BillingController.exportInvoiceDetail id: ${id} user: ${req.user.email}`);

      const invoice = await Invoice.findById(id).populate([
        { path: 'company', select: ['_id', 'name', 'businessName', 'rut'] }
      ]);
      if (!invoice) {
        return res.status(404).json({ message: 'Invoice no encontrado.' });
      }

      const company: any = invoice.company || {};
      const companyName = company.name || '';
      const safeCompany = companyName.replace(/[^a-zA-Z0-9-_]+/g, '_') || 'company';
      const periodLabel = invoice.period
        ? moment(invoice.period, 'YYYYMM').format('MMMM YYYY')
        : String(invoice._id);
      const filename = `billing-detail-${safeCompany}-${invoice.period || invoice._id}.xlsx`;

      const detail: any = invoice.detail || {};
      const containersGroup = detail?.desconsolidado?.containers;
      const unitsGroup = detail?.desconsolidado?.codedUnits;
      const aforoGroup = detail?.aforo?.aforo;
      const aforoSagGroup = detail?.aforo?.aforoSAG;

      // Human-readable label for the content type (aka Tipo de desconsolidado)
      const desconsolidadoLabel = (contentType?: string): string => {
        switch (contentType) {
          case 'coded-items': return 'Anuncio Vehículos';
          case 'general-items': return 'Anuncio Carga';
          default: return '';
        }
      };

      // Map InventoryCar id -> container BIC, so we can show the parent BIC on each unit row.
      const bicByInventoryCarId: Record<string, string> = {};
      if (Array.isArray(containersGroup?.items)) {
        for (const c of containersGroup.items) {
          if (c?.inventoryCarId && c?.bic) {
            bicByInventoryCarId[String(c.inventoryCarId)] = String(c.bic);
          }
        }
      }

      // Resolve form names for the aforo sheets (single query).
      const formNamesById: Record<string, string> = {};
      const formIds: any[] = [];
      for (const g of [aforoGroup, aforoSagGroup]) {
        if (Array.isArray(g?.items)) {
          for (const it of g.items) if (it?.formId) formIds.push(it.formId);
        }
      }
      if (formIds.length) {
        const forms = await Form.find({ _id: { $in: formIds } }, { name: 1 }).lean();
        for (const f of forms as any[]) {
          formNamesById[String(f._id)] = f.name || '';
        }
      }

      const workbook = new excel.Workbook();
      workbook.creator = 'Octimize';
      workbook.created = new Date();

      // ------------------------------------------------------------------
      // 1) Resumen sheet
      // ------------------------------------------------------------------
      const resumen = workbook.addWorksheet('Resumen', {
        pageSetup: { fitToPage: true, fitToHeight: 100, fitToWidth: 1 }
      });
      resumen.columns = [
        { key: 'a', width: 28 },
        { key: 'b', width: 20 },
        { key: 'c', width: 20 },
        { key: 'd', width: 20 }
      ];

      resumen.mergeCells('A1:D1');
      const titleCell = resumen.getCell('A1');
      titleCell.value = 'Detalle de Facturación';
      titleCell.font = { size: 16, bold: true };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

      const headerPairs: Array<[string, any]> = [
        ['Empresa', companyName],
        ['Razón Social / RUT', `${company.businessName || ''} / ${company.rut || ''}`],
        ['Período', `${periodLabel} (${invoice.period || ''})`],
        ['Tipo de cambio', invoice.valueDolar ? `${invoice.valueDolar} CLP/USD` : '']
      ];
      let rowIdx = 3;
      for (const [label, value] of headerPairs) {
        const row = resumen.getRow(rowIdx++);
        row.getCell(1).value = label;
        row.getCell(1).font = { bold: true };
        resumen.mergeCells(`B${row.number}:D${row.number}`);
        row.getCell(2).value = value;
      }

      rowIdx++; // blank row

      // Concepts table header
      const conceptHeaderRow = resumen.getRow(rowIdx++);
      conceptHeaderRow.values = ['Concepto', 'Unidades', 'Precio unit. USD', 'Subtotal USD'];
      conceptHeaderRow.font = { bold: true };
      conceptHeaderRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFEFEF' } };
        cell.border = { bottom: { style: 'thin' } };
      });

      const conceptRows: Array<{ label: string; group: any; sheet?: string }> = [
        { label: 'Contenedores (desconsolidado)', group: containersGroup, sheet: 'Contenedores' },
        { label: 'Unidades (desconsolidado)', group: unitsGroup, sheet: 'Unidades' },
        { label: 'Aforo', group: aforoGroup, sheet: 'Aforo' },
        { label: 'Aforo SAG', group: aforoSagGroup, sheet: 'Aforo SAG' }
      ];

      let grandTotalUsd = 0;
      for (const c of conceptRows) {
        if (!c.group) continue;
        const count = c.group.count || 0;
        const subtotal = c.group.price || 0;
        const unitPrice = count > 0 ? subtotal / count : 0;
        grandTotalUsd += subtotal;
        const row = resumen.getRow(rowIdx++);
        row.values = [c.label, count, unitPrice, subtotal];
        row.getCell(3).numFmt = '#,##0.00';
        row.getCell(4).numFmt = '#,##0.00';
      }

      rowIdx++; // blank
      const totalUsdRow = resumen.getRow(rowIdx++);
      totalUsdRow.values = ['TOTAL USD', '', '', invoice.totalDolar || grandTotalUsd];
      totalUsdRow.font = { bold: true };
      totalUsdRow.getCell(4).numFmt = '#,##0.00';

      if (invoice.totalPeso) {
        const totalClpRow = resumen.getRow(rowIdx++);
        totalClpRow.values = ['TOTAL CLP', '', '', invoice.totalPeso];
        totalClpRow.font = { bold: true };
        totalClpRow.getCell(4).numFmt = '#,##0';
      }

      rowIdx++;
      const hintRow = resumen.getRow(rowIdx++);
      hintRow.getCell(1).value = 'Ver las otras hojas para el detalle por BIC / VIN.';
      hintRow.getCell(1).font = { italic: true, color: { argb: 'FF666666' } };

      resumen.views = [{ state: 'frozen', ySplit: 2 }];

      // Helper to build a detail sheet with a totals row and autoFilter.
      const addDetailSheet = (
        name: string,
        columns: Array<{ header: string; key: string; width: number; numFmt?: string }>,
        items: any[],
        mapRow: (it: any) => any,
        totalsConfig: { labelCol: string; valueCol: string; count: number; subtotal: number; numFmt?: string }
      ) => {
        const ws = workbook.addWorksheet(name, {
          pageSetup: { fitToPage: true, fitToHeight: 100, fitToWidth: 1 }
        });
        ws.columns = columns.map((c) => ({
          header: c.header,
          key: c.key,
          width: c.width,
          style: c.numFmt ? { numFmt: c.numFmt } : undefined
        }));

        // Header styling
        const headerRow = ws.getRow(1);
        headerRow.font = { bold: true };
        headerRow.eachCell((cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFEFEF' } };
          cell.border = { bottom: { style: 'thin' } };
        });

        // Data rows
        for (const it of items) ws.addRow(mapRow(it));

        // Totals row
        const totalsRow = ws.addRow({});
        totalsRow.getCell(totalsConfig.labelCol).value = `TOTAL (${totalsConfig.count})`;
        totalsRow.getCell(totalsConfig.labelCol).font = { bold: true };
        totalsRow.getCell(totalsConfig.valueCol).value = totalsConfig.subtotal;
        totalsRow.getCell(totalsConfig.valueCol).font = { bold: true };
        totalsRow.getCell(totalsConfig.valueCol).numFmt = totalsConfig.numFmt || '#,##0.00';

        // Freeze header + filter
        ws.views = [{ state: 'frozen', ySplit: 1 }];
        ws.autoFilter = {
          from: { row: 1, column: 1 },
          to: { row: 1, column: columns.length }
        };
        return ws;
      };

      // ------------------------------------------------------------------
      // 2) Contenedores sheet
      // ------------------------------------------------------------------
      if (Array.isArray(containersGroup?.items) && containersGroup.items.length) {
        addDetailSheet(
          'Contenedores',
          [
            { header: 'BIC', key: 'bic', width: 22 },
            { header: 'Tipo de desconsolidado', key: 'contentType', width: 22 },
            { header: 'Nave', key: 'nave', width: 22 },
            { header: 'N° Viaje', key: 'viaje', width: 14 },
            { header: 'Fecha de carga', key: 'datetime', width: 22, numFmt: 'dd/mm/yyyy hh:mm' },
            { header: 'Precio USD', key: 'price', width: 14, numFmt: '#,##0.00' }
          ],
          containersGroup.items,
          (it: any) => ({
            bic: it.bic || '',
            contentType: desconsolidadoLabel(it.contentType),
            nave: it.nave || '',
            viaje: it.viaje || '',
            datetime: it.datetime ? new Date(it.datetime) : null,
            price: typeof it.price === 'number' ? it.price : null
          }),
          { labelCol: 'E', valueCol: 'F', count: containersGroup.count || 0, subtotal: containersGroup.price || 0 }
        );
      }

      // ------------------------------------------------------------------
      // 3) Unidades sheet
      // ------------------------------------------------------------------
      if (Array.isArray(unitsGroup?.items) && unitsGroup.items.length) {
        addDetailSheet(
          'Unidades',
          [
            { header: 'VIN', key: 'vin', width: 24 },
            { header: 'BIC Contenedor', key: 'containerBic', width: 22 },
            { header: 'Tipo de desconsolidado', key: 'contentType', width: 22 },
            { header: 'Nave', key: 'nave', width: 22 },
            { header: 'N° Viaje', key: 'viaje', width: 14 },
            { header: 'Fecha de carga', key: 'datetime', width: 22, numFmt: 'dd/mm/yyyy hh:mm' },
            { header: 'Precio USD', key: 'price', width: 14, numFmt: '#,##0.00' }
          ],
          unitsGroup.items,
          (it: any) => ({
            vin: it.vin || '',
            containerBic: it.containerCarId ? bicByInventoryCarId[String(it.containerCarId)] || '' : '',
            contentType: desconsolidadoLabel(it.contentType),
            nave: it.nave || '',
            viaje: it.viaje || '',
            datetime: it.datetime ? new Date(it.datetime) : null,
            price: typeof it.price === 'number' ? it.price : null
          }),
          { labelCol: 'F', valueCol: 'G', count: unitsGroup.count || 0, subtotal: unitsGroup.price || 0 }
        );
      }

      // ------------------------------------------------------------------
      // 4) Aforo sheet
      // ------------------------------------------------------------------
      const buildAforoSheet = (sheetName: string, group: any) => {
        if (!Array.isArray(group?.items) || !group.items.length) return;
        addDetailSheet(
          sheetName,
          [
            { header: 'VIN', key: 'vin', width: 24 },
            { header: 'Formulario', key: 'form', width: 32 },
            { header: 'Fecha de revisión', key: 'datetime', width: 22, numFmt: 'dd/mm/yyyy hh:mm' },
            { header: 'Precio USD', key: 'price', width: 14, numFmt: '#,##0.00' }
          ],
          group.items,
          (it: any) => ({
            vin: it.vin || '',
            form: it.formId ? formNamesById[String(it.formId)] || String(it.formId) : '',
            datetime: it.datetime ? new Date(it.datetime) : null,
            price: typeof it.price === 'number' ? it.price : null
          }),
          { labelCol: 'C', valueCol: 'D', count: group.count || 0, subtotal: group.price || 0 }
        );
      };
      buildAforoSheet('Aforo', aforoGroup);
      buildAforoSheet('Aforo SAG', aforoSagGroup);

      // ------------------------------------------------------------------
      // Fallback for old invoices without items[]
      // ------------------------------------------------------------------
      const hasAnyItems =
        (Array.isArray(containersGroup?.items) && containersGroup.items.length) ||
        (Array.isArray(unitsGroup?.items) && unitsGroup.items.length) ||
        (Array.isArray(aforoGroup?.items) && aforoGroup.items.length) ||
        (Array.isArray(aforoSagGroup?.items) && aforoSagGroup.items.length);

      if (!hasAnyItems) {
        const ws = workbook.addWorksheet('Detalle no disponible');
        ws.columns = [{ header: 'Mensaje', key: 'msg', width: 100 }];
        ws.getRow(1).font = { bold: true };
        ws.addRow({
          msg: 'Este invoice fue generado antes de capturar el detalle por BIC / VIN. Re-ejecute el proceso de billing para poblar el detalle.'
        });
      }

      // ------------------------------------------------------------------
      // Write out via tempfile (matches the pattern in apiDetail)
      // ------------------------------------------------------------------
      const tempFilePath = tempfile('.xlsx');
      await workbook.xlsx.writeFile(tempFilePath);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      return res.sendFile(tempFilePath);
    } catch (e) {
      logger.error(e);
      if (!res.headersSent) {
        return res.status(500).json({ message: 'Ha ocurrido un error generando el detalle.' });
      }
      return;
    }
  }

  /**
   * Estimación del período EN CURSO (el mes de hoy), sin cerrar nada.
   *
   * Corre el mismo cálculo que el billing real en modo dry-run: no escribe
   * invoice ni toca la base. El período es `moment().format('YYYYMM')`, no el
   * que usaría el cron — la idea es ver cómo viene el mes, no recalcular el
   * anterior.
   *
   * El `detail` del dry-run trae miles de ítems (uno por contenedor y unidad),
   * así que acá se resume y NUNCA se manda entero al browser.
   */
  public async apiCurrentPeriod(req: IRequest, res: Response) {
    const team = req.user.team._id;
    const companyId = String(req.user.company._id);
    const period = moment().format('YYYYMM');
    const start = moment(period, 'YYYYMM').startOf('month');

    try {
      logger.info(`BillingController.apiCurrentPeriod: ${req.user.email} period: ${period}`);

      const summary = await new BillingQueue().processBilling(team, {
        dryRun: true,
        period,
        rethrow: true
      });

      // Mismo criterio de alcance que apiList: admin ve todo el team, el resto
      // solo su propia company.
      const rows = (summary || [])
        .filter((r: any) => req.user.isAdmin || String(r.companyId) === companyId)
        .map((r: any) => {
          const desc = r.detail?.desconsolidado ?? {};
          const aforo = r.detail?.aforo ?? {};
          const aforoCount = Object.keys(aforo)
            .reduce((n: number, k: string) => n + (aforo[k]?.count ?? 0), 0);
          const aforoPrice = Object.keys(aforo)
            .reduce((n: number, k: string) => n + (aforo[k]?.price ?? 0), 0);

          return {
            company: r.company,
            companyId: r.companyId,
            containers: r.containers,
            inventoryCars: r.inventoryCars,
            valueDolar: r.valueDolar,
            totalDolar: r.totalDolar,
            totalPeso: r.totalPeso,
            invoiceAlreadyExists: r.invoiceAlreadyExists,
            breakdown: {
              containers: {
                count: desc.containers?.count ?? 0,
                price: desc.containers?.price ?? 0
              },
              units: {
                count: desc.codedUnits?.count ?? 0,
                price: desc.codedUnits?.price ?? 0
              },
              aforo: { count: aforoCount, price: aforoPrice }
            }
          };
        });

      const now = moment();
      return res.json({
        period,
        periodLabel: start.format('MMMM YYYY'),
        // Para que la pantalla pueda decir "parcial, al día X de Y".
        dayOfMonth: now.date(),
        daysInMonth: start.daysInMonth(),
        generatedAt: now.toDate(),
        results: rows,
        status: 200
      });
    } catch (e: any) {
      logger.error(`BillingController.apiCurrentPeriod error: ${e?.message}`);
      console.error(e);
      return res.status(500).json({
        message: 'No se pudo calcular el período en curso.',
        status: 500
      });
    }
  }

  public async run(req: IRequest, res: Response) {
    const team = req.user.team._id;
    // Para probar sin escribir nada:
    //   /settings/billing/run/?dryRun=true&period=202607
    //
    // `period` (YYYYMM) es importante al correr a mano: sin él el período se
    // deriva del día de la corrida y a fin de mes apunta al mes EN CURSO. Si
    // además se guarda, ese invoice bloquea la corrida real del cron para el
    // mismo período (ver el chequeo de duplicados en billing.task.ts).
    const { dryRun, period } = req.query as { dryRun?: string; period?: string };
    const isDryRun = String(dryRun) === 'true';

    try {
      await new BillingQueue().processBilling(team, {
        dryRun: isDryRun,
        period: period || undefined
      });
      res.json({
        status: 'ok',
        dryRun: isDryRun,
        period: period || null,
        message: isDryRun
          ? 'Billing dry-run completed: no invoices were saved. Ver el log del servidor y /tmp/billing-dryrun-<team>-<period>.json'
          : 'Billing process completed successfully.'
      });
    } catch (e) {
      /* istanbul ignore next  */
      if (e) {
        res.status(500).json(e);
      }
    }
  }

  private getInvoices(filter: any, options: PaginateOptions): Promise<PaginateResult<IInvoiceModel>> {
    return new Promise((resolve, reject) => {
      Invoice.paginate(filter, options, (err, result) => {
        /* istanbul ignore next  */
        if (err) {
          return reject(err);
        }
        return resolve(result);
      });
    });
  }

}

export default new BillingController();
