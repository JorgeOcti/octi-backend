import {Job, Queue} from 'kue';
import * as kue from 'kue';
import * as pug from 'pug';
import * as path from 'path';
import nodemailerTransporter from '../../services/aws-ses.service';
import {compileTemplate} from "pug";

class EmailQueue {
  public queue: Queue;

  constructor() {
    this.queue = kue.createQueue();
    this.generateHTML = this.generateHTML.bind(this);
    this.processEmail = this.processEmail.bind(this);
  }

  public run() {
    this.queue.process('email', this.processEmail);
  }

  public generateHTML(view: string, context: any): string {
    const templatePath = path.join(__dirname, '../../../views/') + 'emails/' + view + '.pug';
    const pugCompile: compileTemplate = pug.compileFile(templatePath);

    console.log('templatePath', templatePath);
    return pugCompile(context);
  }

  public processEmail(job?: Job, done?: (error?: Error | null, data?: object) => void) {
    if (job && done) {
      console.log('---------------------------');
      console.log(JSON.stringify(job));
      console.log('---------------------------');

      // generate email
      let mail: any = {};
      mail.from = '"OSA Andes"<no-reply-andes@osacontrol.com>';
      mail.to = job.data.to;
      mail.subject =job.data.subject;
      mail.text = job.data.text;
      mail.html = this.generateHTML(job.data.view, job.data.context);

      // add atachments if exist
      mail.attachments = job.data.attachments || [];

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
