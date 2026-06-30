import * as AWS from 'aws-sdk';
import * as nodemailer from 'nodemailer';
// import * as path from 'path';

// AWS.config.loadFromPath(path.join(__dirname, '../../ses-config.json'));
const ses = new AWS.SES({
  apiVersion: '2010-12-01',
  region: process.env.SES_REGION || 'sa-east-1',
  // On ECS, force the SES client onto the task role (which has ses:SendEmail).
  // Otherwise the SDK's default chain picks up AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY
  // from the env — those belong to the S3-only app-uploads user and SES would 403.
  // Off ECS (local/dev), fall back to the default provider chain.
  credentials: process.env.AWS_CONTAINER_CREDENTIALS_RELATIVE_URI
    ? new AWS.ECSCredentials()
    : undefined
});
// ses.setIdentityDkimEnabled({
//   DkimEnabled: true,
//   Identity: 'soporte@osacontrol.com'
// });
const transport = nodemailer.createTransport({
  SES: ses
});

export default transport;
