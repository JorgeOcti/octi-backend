import * as nodemailer from 'nodemailer';
import * as AWS from 'aws-sdk';
import * as path from "path";

AWS.config.loadFromPath(path.join(__dirname, '../../ses-config.json'));

const transport = nodemailer.createTransport({
  SES: new AWS.SES({
    apiVersion: '2010-12-01'
  })
});

export default transport;
