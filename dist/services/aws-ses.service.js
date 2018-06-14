"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const nodemailer = require("nodemailer");
const AWS = require("aws-sdk");
const path = require("path");
AWS.config.loadFromPath(path.join(__dirname, '../../ses-config.json'));
const transport = nodemailer.createTransport({
    SES: new AWS.SES({
        apiVersion: '2010-12-01'
    })
});
exports.default = transport;
//# sourceMappingURL=aws-ses.service.js.map