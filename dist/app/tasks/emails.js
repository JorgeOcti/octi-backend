"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const kue = require("kue");
class EmailQueue {
    constructor() {
        this.queue = kue.createQueue();
    }
    run() {
        this.queue.process('email', this.sendMail);
    }
    sendMail(job, done) {
        console.log('send mail');
        console.log(JSON.stringify(job));
        if (done)
            done(null, {});
    }
}
exports.default = new EmailQueue();
//# sourceMappingURL=emails.js.map