import * as fs from 'fs';
import * as moment from 'moment-timezone';
import * as path from 'path';
import puppeteer from 'puppeteer';

import InvoiceTeamBilling, {
  IInvoiceTeamBillingModel
} from '../models/invoiceTeamBilling.module';
import { IInvoiceTeamBilling } from '../interfaces/invoiceTeamBilling.interface';
import GeneralUtils from '../../utils/general.utils';

import emailQueue from '../../app/tasks/email.task';
class BillingTeamPDF {
  constructor () {
    this.sendEmail = this.sendEmail.bind(this);
    this.generateHTML = this.generateHTML.bind(this);
    this.createPDF = this.createPDF.bind(this);
    this.processPDFInvoices = this.processPDFInvoices.bind(this);
  }

  private sendEmail(invoice: IInvoiceTeamBillingModel): void {
    const period = moment(invoice.createdAt).format('MMMM YYYY');
    for (const notification of invoice.teamBilling.notifications) {
      emailQueue.queue.add(
        'email',
        {
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
        },
        { attempts: 3, backoff: 1000, removeOnComplete: true }
      );
    }
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
          executablePath: '/usr/bin/chromium',
          args: [
            '--no-sandbox',
            '--allow-file-access-from-files',
            '--enable-local-file-accesses',
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
              // invoice.file = invoice.file;
              await invoice.save();
              // this.sendEmail(invoice);
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
