import * as fs from 'fs';
import * as moment from 'moment-timezone';
import * as path from 'path';
import puppeteer from 'puppeteer';

import InvoiceTeamBilling, {
  IInvoiceTeamBillingModel
} from '../models/invoiceTeamBilling.module';
import { IInvoiceTeamBilling } from '../interfaces/invoiceTeamBilling.interface';
import GeneralUtils from '../../utils/general.utils';

class BillingTeamPDF {
  constructor () {
    console.log('Starting PDF creation...');
    this.generateHTML = this.generateHTML.bind(this);
    this.createPDF = this.createPDF.bind(this);
    this.processPDFInvoices = this.processPDFInvoices.bind(this);
  }

  public generateHTML(invoice: IInvoiceTeamBilling): string {
    moment.locale('es');
    moment.tz.setDefault('America/Santiago');
    const css = fs.readFileSync(
      `${path.join(
        __dirname,
        '../../../views/'
      )}billing/pdf-corporate/style.css`,
      'utf8'
    );
    const templatePath: string = `${path.join(
      __dirname,
      '../../../views/'
    )}billing/pdf-corporate/index.pug`;
    return GeneralUtils.generateHtmlFromPugFile(templatePath, {
      css: css.replace(/(\r\n|\n|\r)/gm, ''),
      moment,
      invoice,
      jsUcfirst: (text: string) => text.charAt(0).toUpperCase() + text.slice(1)
    });
  }

  public async createPDF(invoice: IInvoiceTeamBillingModel): Promise<void> {
    try {
      const newInvoice = await InvoiceTeamBilling.findById(
        invoice._id
      ).populate([
        {
          path: 'team'
        },
        {
          path: 'companies.company',
          select: ['_id', 'name']
        }
      ]);
      if (newInvoice) {
        const filename = `invoice-${invoice._id}.pdf`;
        const path = `/tmp/${filename}`;
        // launch a new chrome instance
        const browser = await puppeteer.launch({
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
              this.sendEmail(invoice);
            }
          }
        );
      }
    } catch (e) {
      // Raven.captureException(e);
      console.log(e.message);
    }
  }

  public async processPDFInvoices(): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const invoices = await InvoiceTeamBilling.find({
          createdAt: {
            $gte: moment().startOf('day').toDate(),
            $lte: moment().endOf('day').toDate()
          }
        });

        for (const invoice of invoices) {
          await this.createPDF(invoice);
        }

        // Resolve promise
        resolve({});
      } catch (error) {
        console.log(`Error ${error} trying to generate PDFs`);
        reject({});
      }
    });
  }
}

export default BillingTeamPDF;
