import * as Queue from 'bull';
import * as he from 'he';
import * as Mail from 'nodemailer/lib/mailer';
import * as path from 'path';
import * as pug from 'pug';
import { compileTemplate } from 'pug';
import nodemailerTransporter from '../../services/aws-ses.service';
import logger from '../../services/logger.service';
import { createRedisClient } from '../../services/redis.service';

class EmailQueue {
  public queue: Queue.Queue;
  readonly processJob: boolean = true;

  constructor() {
    this.queue = new Queue('email', {
      createClient: () => {
        return createRedisClient();
      },
      prefix: '{andes}'
    });
    this.generateHTML = this.generateHTML.bind(this);
    this.process = this.process.bind(this);
  }

  public run() {
    this.queue.process('email', this.process);
  }

  private generateHTML(view: string, context: any): string {
    const extension = view.includes('.pug', view.length - 4) ? '' : '.pug';
    const templatePath: string = path.join(__dirname, '../../../views/') + 'emails/' + view + extension;
    const pugCompile: compileTemplate = pug.compileFile(templatePath);
    return pugCompile(context);
  }

  private process(job: Queue.Job<any>, done: Queue.DoneCallback) {
    if (this.processJob) {
      logger.info('start EmailQueue.process');
      // generate email
      const mail: Mail.Options = {
        from: `"${job.data.from && job.data.from.length ? job.data.from : 'OSA Andes'}"<soporte@osacontrol.com>`,
        to: job.data.to,
        bcc: job.data.bcc,
        subject: job.data.subject,
        text: he.encode(job.data.text),
        html: this.generateHTML(job.data.view, job.data.context),
        attachments: job.data.attachments || [],
        headers: {
          // 'Content-Type:': 'text/html; charset="UTF-8"',
          'Reply-To': 'OSA Andes<soporte@osacontrol.com>',
          'List-Unsubscribe': '<mailto:soporte@osacontrol.com?subject=Unsubscribe>',
          'List-ID': 'mail.osacontrol.com',
          'X-Report-Abuse-To': 'abuse@osacontrol.com'
        }
      };

      logger.info(`EmailQueue.process: ${JSON.stringify(mail)}`);
      // send mail with defined transport object
      nodemailerTransporter.sendMail(mail, (error, info) => {
        if (error) {
          console.log(error);
          done(error);
        }
        logger.info(`Message ${info.messageId} sent: ${info.response}`);
        done(null, {});
        // console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
      });
    }
  }

}

const emailQueue = new EmailQueue();
export default emailQueue;
