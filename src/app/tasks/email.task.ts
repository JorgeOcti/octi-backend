import {Job, Queue} from 'kue';
import * as Mail from 'nodemailer/lib/mailer';
import * as path from 'path';
import * as pug from 'pug';
import logger from '../../services/logger.service';
import {compileTemplate} from 'pug';
import nodemailerTransporter from '../../services/aws-ses.service';

class EmailQueue {
  private queue: Queue;

  constructor(queue: Queue) {
    this.queue = queue;
    this.generateHTML = this.generateHTML.bind(this);
    this.processEmail = this.processEmail.bind(this);
  }

  public run() {
    this.queue.process('email', this.processEmail);
  }

  private generateHTML(view: string, context: any): string {
    const extension = view.includes('.pug', view.length-4) ? '': '.pug';
    const templatePath: string = path.join(__dirname, '../../../views/') + 'emails/' + view + extension;
    const pugCompile: compileTemplate = pug.compileFile(templatePath);
    return pugCompile(context);
  }

  private processEmail(job: Job, done: (error?: Error | null, data?: object) => void) {
    if (job && done) {
      job.log('start process');
      // generate email
      const mail: Mail.Options = {
        from: `"${job.data.from && job.data.from.length ? job.data.from : 'OSA Andes'}"<osa.andes@osacontrol.com>`,
        // to: job.data.to,
        to: job.data.to,
        bcc: job.data.bcc,
        subject: job.data.subject,
        text: job.data.text,
        html: this.generateHTML(job.data.view, job.data.context),
        attachments: job.data.attachments || [],
        headers: {
          'Reply-To': 'OSA Andes<osa.andes@osacontrol.com>',
          'List-Unsubscribe': '<mailto:soporte@osacontrol.com?subject=Unsubscribe>',
          'List-ID': 'mail.osacontrol.com',
          'X-Report-Abuse-To': 'abuse@osacontrol.com',
          'X-CSA-Complaints': 'whitelistcomplaints@eco.de'
        }
      };
      job.log('send email');
      // send mail with defined transport object
      nodemailerTransporter.sendMail(mail, (error, info) => {
        if (error) {
          console.log(error);
          done(error);
        }
        done(null, {});
        // job.log(`Message ${info.messageId} sent: ${info.response}`);
        /* istanbul ignore next */
        // if (app.get('env') !== 'testing') {
        //   console.log('Message %s sent: %s', info.messageId, info.response);
        // }
        // console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
      });
    }
  }
}

export default EmailQueue;
