"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const nodemailer = require("nodemailer");
// import * as path from 'path';
// AWS.config.loadFromPath(path.join(__dirname, '../../ses-config.json'));
// const transport = nodemailer.createTransport({
//   SES: new AWS.SES({
//     apiVersion: '2010-12-01',
//     region: process.env.SES_REGION || 'us-west-2'
//   })
// });
const transport = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'jorge@osacontrol.com',
        pass: 'Andromeda2016' // naturally, replace both with your real credentials or an application-specific password
    }
});
exports.default = transport;
//# sourceMappingURL=aws-ses.service.js.map