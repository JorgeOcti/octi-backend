"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const nodemailer = require("nodemailer");
const AWS = require("aws-sdk");
AWS.config.loadFromPath('../../ses-config.json');
exports.default = nodemailer.createTransport({
    SES: new AWS.SES({
        apiVersion: '2010-12-01'
    })
});
//# sourceMappingURL=aws-ses.service.js.map