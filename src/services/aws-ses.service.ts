import * as nodemailer from 'nodemailer';
import * as AWS from 'aws-sdk';

AWS.config.update({
  region: 'us-west-2',
});

export default nodemailer.createTransport({
  SES: new AWS.SES({
    apiVersion: '2010-12-01'
  })
});
