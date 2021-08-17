"use strict";
exports.__esModule = true;
var AWS = require("aws-sdk");
var nodemailer = require("nodemailer");
// import * as path from 'path';
// AWS.config.loadFromPath(path.join(__dirname, '../../ses-config.json'));
var transport = nodemailer.createTransport({
    SES: new AWS.SES({
        apiVersion: '2010-12-01',
        region: process.env.SES_REGION || 'us-west-2'
    })
});
exports["default"] = transport;
//# sourceMappingURL=aws-ses.service.js.map