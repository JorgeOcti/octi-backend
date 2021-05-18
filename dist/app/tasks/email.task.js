"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const pug = require("pug");
const aws_ses_service_1 = require("../../services/aws-ses.service");
class EmailQueue {
    constructor(queue) {
        this.queue = queue;
        this.generateHTML = this.generateHTML.bind(this);
        this.processEmail = this.processEmail.bind(this);
    }
    run() {
        this.queue.process('email', this.processEmail);
    }
    generateHTML(view, context) {
        const extension = view.includes('.pug', view.length - 4) ? '' : '.pug';
        const templatePath = path.join(__dirname, '../../../views/') + 'emails/' + view + extension;
        const pugCompile = pug.compileFile(templatePath);
        return pugCompile(context);
    }
    processEmail(job, done) {
        if (job && done) {
            job.log('start process');
            // generate email
            const mail = {
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
            aws_ses_service_1.default.sendMail(mail, (error, info) => {
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
exports.default = EmailQueue;
//# sourceMappingURL=email.task.js.map