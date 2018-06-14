import {Job, Queue} from 'kue';
import * as kue from 'kue';
import * as pug from 'pug';
import * as path from 'path';
import nodemailerTransporter from '../../services/aws-ses.service';
import {compileTemplate} from "pug";
import * as Mail from "nodemailer/lib/mailer";

class EmailQueue {
  private queue: Queue;

  constructor() {
    this.queue = kue.createQueue();
    this.generateHTML = this.generateHTML.bind(this);
    this.processEmail = this.processEmail.bind(this);
  }

  public run() {
    this.queue.process('email', this.processEmail);
  }

  private generateHTML(view: string, context: any): string {
    const templatePath: string = path.join(__dirname, '../../../views/') + 'emails/' + view + '.pug';
    const pugCompile: compileTemplate = pug.compileFile(templatePath);
    return pugCompile(context);
  }

  private processEmail(job?: Job, done?: (error?: Error | null, data?: object) => void) {
    if (job && done) {

      // generate email
      const mail: Mail.Options = {
        from: `"${job.data.from && job.data.from.length ? job.data.from : 'OSA Andes'}"<no-reply-andes@osacontrol.com>`,
        to: job.data.to,
        subject: job.data.subject,
        text: job.data.text,
        html: this.generateHTML(job.data.view, job.data.context),
        attachments: job.data.attachments || []
      };
      console.log('---------------------------');
      console.log(JSON.stringify(mail));
      console.log('---------------------------');
      console.log(JSON.stringify(process.env));
      console.log('---------------------------');

      // send mail with defined transport object
      nodemailerTransporter.sendMail(mail, (error, info) => {
        if (error) {
          console.log(error);
          done(error);
        }
        done(null, {});
        console.log('Message %s sent: %s', info.messageId, info.response);
      });
    }
  }
}

export default new EmailQueue();
