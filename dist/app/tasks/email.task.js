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
        console.log('templatePath', templatePath);
        return pugCompile(context);
    }
    processEmail(job, done) {
        if (job && done) {
            console.log('---------------------------');
            console.log(JSON.stringify(job));
            console.log('---------------------------');
            // generate email
            let mail = {};
            mail.from = '"OSA Andes"<no-reply-andes@osacontrol.com>';
            mail.to = job.data.to;
            mail.subject = job.data.subject;
            mail.text = job.data.text;
            mail.html = this.generateHTML(job.data.view, job.data.context);
            // add atachments if exist
            mail.attachments = job.data.attachments || [];
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