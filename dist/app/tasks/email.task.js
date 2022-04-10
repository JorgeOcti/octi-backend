"use strict";
exports.__esModule = true;
var path = require("path");
var pug = require("pug");
var aws_ses_service_1 = require("../../services/aws-ses.service");
var he = require("he");
var EmailQueue = /** @class */ (function () {
    function EmailQueue(queue) {
        this.queue = queue;
        this.generateHTML = this.generateHTML.bind(this);
        this.processEmail = this.processEmail.bind(this);
    }
    EmailQueue.prototype.run = function () {
        this.queue.process('email', this.processEmail);
    };
    EmailQueue.prototype.generateHTML = function (view, context) {
        var extension = view.includes('.pug', view.length - 4) ? '' : '.pug';
        var templatePath = path.join(__dirname, '../../../views/') + 'emails/' + view + extension;
        var pugCompile = pug.compileFile(templatePath);
        return pugCompile(context);
    };
    EmailQueue.prototype.processEmail = function (job, done) {
        if (job) {
            job.log('start process');
            // generate email
            var mail = {
                from: "\"".concat(job.data.from && job.data.from.length ? job.data.from : 'OSA Andes', "\"<soporte@osacontrol.com>"),
                // to: job.data.to,
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
            job.log('send email');
            // send mail with defined transport object
            aws_ses_service_1["default"].sendMail(mail, function (error, info) {
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
    };
    return EmailQueue;
}());
exports["default"] = EmailQueue;
//# sourceMappingURL=email.task.js.map