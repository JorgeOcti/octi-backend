"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const kue = require("kue");
const pug = require("pug");
const path = require("path");
const aws_ses_service_1 = require("../../services/aws-ses.service");
class EmailQueue {
    constructor() {
        this.queue = kue.createQueue();
        this.generateHTML = this.generateHTML.bind(this);
        this.processEmail = this.processEmail.bind(this);
    }
    run() {
        this.queue.process('email', this.processEmail);
    }
    generateHTML(view, context) {
        const templatePath = path.join(__dirname, '../../../views/') + 'emails/' + view + '.pug';
        const pugCompile = pug.compileFile(templatePath);
        return pugCompile(context);
    }
    processEmail(job, done) {
        if (job && done) {
            // generate email
            const mail = {
                from: `"${job.data.from && job.data.from.length ? job.data.from : 'OSA Andes'}"<osa.andes@osacontrol.com>`,
                // to: job.data.to,
                to: job.data.to,
                subject: job.data.subject,
                text: job.data.text,
                html: this.generateHTML(job.data.view, job.data.context),
                attachments: job.data.attachments || [],
                headers: {
                    'List-Unsubscribe': "<mailto:soporte@osacontrol.com?subject=Unsubscribe>",
                    'List-Subscribe': "<mailto:soporte@osacontrol.com?subject=Subscribe>",
                    'List-ID': "mail.osacontrol.com",
                    'X-Report-Abuse-To': "abuse@osacontrol.com",
                    'X-CSA-Complaints': "whitelistcomplaints@eco.de"
                }
            };
            // console.log('---------------------------');
            // console.log(JSON.stringify(mail));
            // console.log('---------------------------');
            // console.log(JSON.stringify(process.env));
            // console.log('---------------------------');
            // send mail with defined transport object
            aws_ses_service_1.default.sendMail(mail, (error, info) => {
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
exports.default = new EmailQueue();
//# sourceMappingURL=email.task.js.map