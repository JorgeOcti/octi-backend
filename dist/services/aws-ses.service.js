"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AWS = require("aws-sdk");
const nodemailer = require("nodemailer");
// import * as path from 'path';
// AWS.config.loadFromPath(path.join(__dirname, '../../ses-config.json'));
const transport = nodemailer.createTransport({
    SES: new AWS.SES({
        apiVersion: '2010-12-01',
        region: process.env.SES_REGION || 'us-west-2'
    })
});
exports.default = transport;
//# sourceMappingURL=aws-ses.service.js.map