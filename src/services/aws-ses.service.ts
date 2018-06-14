import * as nodemailer from 'nodemailer';
import * as AWS from 'aws-sdk';
import * as path from "path";

AWS.config.loadFromPath(path.join(__dirname, '../../ses-config.json'));

export default nodemailer.createTransport({
  SES: new AWS.SES({
    apiVersion: '2010-12-01'
  })
});
