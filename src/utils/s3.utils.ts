import * as AWS from 'aws-sdk';

let s3Config: any = {};
try {
  s3Config = require('../../s3-config.json');
} catch (_) { /* not present in all environments */ }

const s3 = new AWS.S3({
  accessKeyId: process.env.S3_KEY || s3Config.accessKeyId,
  secretAccessKey: process.env.S3_SECRET || s3Config.secretAccessKey,
  region: process.env.S3_REGION || s3Config.region,
  signatureVersion: 'v4',
});

export function signS3Url(url: string): string {
  if (!url) return url;
  try {
    const urlObj = new URL(url);
    const bucket = process.env.S3_BUCKET || s3Config.bucket;
    const key = urlObj.pathname.replace(/^\//, '');
    return s3.getSignedUrl('getObject', { Bucket: bucket, Key: key, Expires: 3600 });
  } catch (_) {
    return url;
  }
}
