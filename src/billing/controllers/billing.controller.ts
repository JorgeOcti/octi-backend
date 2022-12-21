import * as HtmlPdf from 'html-pdf';
import * as excel from 'exceljs';
import * as moment from 'moment-timezone';
import * as tempfile from 'tempfile';

import Invoice, {IInvoiceModel} from '../models/invoice.model';
import {PaginateOptions, PaginateResult} from 'mongoose';
import {Request, Response} from 'express';

import ActivityHistory from '../models/activityHistory.model';
import BillingQueue from '../tasks/billing.task';
import BillingTeamQueue from "../tasks/billingTeam.task";
import {ChoicesTypeActivity} from '../models/activiHistory.types';
import Company from '../../app/models/company.model';
import History from '../../app/models/history.model';
import {IRequest} from '../../interfaces/global.interface';
import InvoiceTeamBilling from "../models/invoiceTeamBilling.module";
import Module from '../models/module.model';
import Submodule from '../models/submodule.model';
import TeamBilling from "../models/teamBilling.model";
import logger from '../../services/logger.service';

class BillingController {

  readonly submodule:any;

  constructor() {
    this.index = this.index.bind(this);
    this.apiList = this.apiList.bind(this);
    this.apiDetail = this.apiDetail.bind(this);
    this.pdf = this.pdf.bind(this);
    this.run = this.run.bind(this);
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
          res.send(html);
        } else {
          HtmlPdf.create(html, billing.PDFconfig).toStream((err, pdfStream) => {
            if (err) {
              console.log(err);
              res.sendStatus(500);
            } else {
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
      } else {
        res.status(400).json({
          message: 'Invoice no encontrado.'
        });
      }
    } catch (e) {
      res.status(500).json(e);
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
          res.send(html);
        } else {
          HtmlPdf.create(html, billing.PDFconfig).toStream((err, pdfStream) => {
            if (err) {
              console.log(err);
              res.sendStatus(500);
            } else {
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
      } else {
        res.status(400).json({
          message: 'Invoice no encontrado.'
        });
      }
    } catch (e) {
      res.status(500).json(e);
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
      const {team} = req.user;
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
      const {team} = req.user;
      const {businessName, modules, notifications, companies, name, rut, baseCost, textBaseCost} = req.body;
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
      }, {new: true});
      return res.json(teamBilling);
    } catch (e) {
      /* istanbul ignore next  */
      return res.status(500).json(e);
    }
  }

  private getOldestInvoiceCorporative(filter: any) {
    return InvoiceTeamBilling
      .findOne(filter)
      .sort({createdAt: 1})
  }

  private getLastInvoiceCorporative(filter: any) {
    return InvoiceTeamBilling
      .findOne(filter)
      .sort({createdAt: -1})
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
      .sort({createdAt: -1});
  }

  public async apiInvoiceCorporative(req: IRequest, res: Response) {
    try {
      const {team} = req.user;
      const {period} = req.query as { period: string };
      let filter: any = {team: team._id};
      if (period) {
        filter = {...filter, period};
      }
      const oldestInvoice = await this.getOldestInvoiceCorporative({team: team._id});
      const lastInvoice = await this.getLastInvoiceCorporative({team: team._id});
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
      const {period} = req.query;
      const {team} = req.user;
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
      }, {histories: true});
      if (invoices) {
        const cursor = History.aggregate([{
          $match: {
            _id: {$in: invoices.histories},
            // company: {
            //   $in: [
            //     new ObjectID('5b8da01ea9683b0bd74fcc53'), // Dercomaq
            //     new ObjectID('5bc88d87a9683ba58c197c24'), // IMCRUZ
            //     new ObjectID('5b17f8f0346a450658b5721e'), // Derco
            //     new ObjectID('5c1a80f84fba86565186a757') // Dercocenter
            //   ]
            // },
            module: {$nin: ['import']},
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
          $unwind: {path: '$car', preserveNullAndEmptyArrays: true}
        }, {
          $lookup: {
            from: 'companies',
            localField: 'company',
            foreignField: '_id',
            as: 'company'
          }
        }, {
          $unwind: {path: '$company', preserveNullAndEmptyArrays: true}
        }, {
          $lookup: {
            from: 'participants',
            localField: 'participant',
            foreignField: '_id',
            as: 'participant'
          }
        }, {
          $unwind: {path: '$participant', preserveNullAndEmptyArrays: true}
        }, {
          $lookup: {
            from: 'users',
            localField: 'createdBy',
            foreignField: '_id',
            as: 'user'
          }
        }, {
          $unwind: {path: '$user', preserveNullAndEmptyArrays: true}
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
        return res.status(404).json({message: 'No se encontró el periodo solicitado'});
      }
    } catch (e) {
      logger.error(e);
    }
  }

  public async run(req: IRequest, res: Response) {
    const team = req.user.team._id;
    try {
      await new BillingQueue().processBilling(team);
      res.json({
        status: 'ok'
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
