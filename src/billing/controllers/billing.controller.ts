import {Request, Response} from "express";
import {IRequest} from "../../interfaces/global.interface";
import {PaginateOptions, PaginateResult} from "mongoose";
import Invoice, {IInvoiceModel} from "../models/invoice.model";
import BillingQueue from "../tasks/billing.task";
import * as HtmlPdf from "html-pdf";

class BillingController {

  constructor() {
    this.index = this.index.bind(this);
    this.apiList = this.apiList.bind(this);
    this.pdf = this.pdf.bind(this);
    this.run = this.run.bind(this);
  }

  /* istanbul ignore next */
  public index(req: Request, res: Response): void {
    res.render('app/index');
  }

  public async pdf(req: IRequest, res: Response) {
    const {id} = req.params;
    const {debug} = req.query as { debug: string };
    try {
      const invoice = await Invoice.findById(id).populate([{path: 'company'}]);
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
      } else{
        res.status(400).json({
          message: "Invoice no encontrado."
        });
      }
    } catch (e) {
      res.status(500).json(e);
    }
  }

  public async apiList(req: IRequest, res: Response) {
    const {company, team} = req.user;
    const {page, pageSize} = req.query as {page: string, pageSize: string};
    const options: PaginateOptions = {
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
      const filter = req.user.isAdmin ? {team} : {company};
      const invoices = await this.getInvoices(filter, options);
      if (options.page && invoices.pages && invoices.pages < options.page) {
        res.status(400).json({
          message: 'La página solicitada no existe.',
          status: 400
        });
      } else {
        res.json({
          count: invoices.total,
          pages: invoices.pages,
          hasPrevious: options.page && options.page > 1 && invoices.pages && invoices.pages >= options.page,
          hasNext: options.page && invoices.pages && invoices.pages > options.page,
          results: invoices.docs,
          status: 200
        });
      }
    } catch (e) {
      /* istanbul ignore next  */
      if (e) {
        res.status(500).json(e);
      }
    }
  }

  public async run(req: IRequest, res: Response) {
    try {
      await new BillingQueue().processBilling();
      res.json({
        status: "ok"
      })
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
