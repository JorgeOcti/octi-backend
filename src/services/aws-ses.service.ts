import * as nodemailer from 'nodemailer';
import * as AWS from 'aws-sdk';

AWS.config.loadFromPath('../../ses-config.json');

export default nodemailer.createTransport({
  SES: new AWS.SES({
    apiVersion: '2010-12-01'
  })
});
