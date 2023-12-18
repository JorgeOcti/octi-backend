import * as moment from 'moment-timezone';
// import * as request from 'request';

import { IInvoiceTeamBillingModel } from '../models/invoiceTeamBilling.module';
import { IInvoiceTeamBilling } from '../interfaces/invoiceTeamBilling.interface';
import BillingTeamProcessor from '../../billing/tasks/billingTeamProcessor.task';
import emailQueue from '../../app/tasks/email.task';
import BillingTeamPDF from './billingTeamPDF.task';

class BillingTeamQueue {
  private apiKey: string = '6d9b28d228cd00669f37484223d876daad754636';
  private billingProcessor: BillingTeamProcessor = new BillingTeamProcessor();
  private pdfProcessor: BillingTeamPDF = new BillingTeamPDF();

  constructor() {
    this.getUFPrice = this.getUFPrice.bind(this);
    this.getDolarPrice = this.getDolarPrice.bind(this);
    this.sendEmail = this.sendEmail.bind(this);
    
    this.generateHTML = this.generateHTML.bind(this);
    this.createPDF = this.createPDF.bind(this);
    this.processBilling = this.processBilling.bind(this);
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
      const [year, month, day] = [
        now.format('YYYY'),
        now.format('MM'),
        now.format('DD')
      ];
      const url = `https://api.sbif.cl/api-sbifv3/recursos_api/dolar/${year}/${month}/dias/${day}?apikey=${this.apiKey}&formato=json`;
      console.log('url', url);
      request.get(url, (err, resp, body) => {
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
      });
    });
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
    return this.pdfProcessor.generateHTML(invoice);
  }

  public async createPDF(invoice: IInvoiceTeamBillingModel): Promise<void> {
    return await this.pdfProcessor.createPDF(invoice);
  }

  public async processBilling(filter: any = {}, run?: boolean): Promise<any> {
    return await this.billingProcessor.processBilling(filter, run);
  }
}

export default BillingTeamQueue;
