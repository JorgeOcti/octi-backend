import NullTriggerDelegate from './nullTrigger.delegate';
import * as AWS from 'aws-sdk';
import * as s3Config from '../../../../../s3-config.json';
import * as fs from 'fs';
import logger from '../../../../services/logger.service';
import { IFormTriggerModel } from '../../../models/trigger.model';
import * as moment from 'moment-timezone';
// import * as HtmlPdf from 'html-pdf';
import ParticipantFile from '../../../models/participantFile.model';
import * as path from 'path';
import GeneralUtils from '../../../../utils/general.utils';
import { IAnyObject } from '../../../../interfaces/global.interface';
import puppeteer from 'puppeteer';

export default class FileTriggerDelegate extends NullTriggerDelegate {


  public async trigger(trigger: IFormTriggerModel, answers: IAnyObject, payload: IAnyObject): Promise<IAnyObject> {
    try {
      logger.info(`FileTriggerDelegate.trigger: ${trigger.kind} performing`);
      let context = this.processTrigerConfig(trigger, answers);
      let filename = `${moment().unix()}_${context.filename}`;
      let { participant } = payload;
      const participantCompany = participant.company || {};

      context.signature = (await ParticipantFile.find({ _id: { $in: context.signature } })).map(f => f.file.url)[0];
      moment.locale('es');
      moment.tz.setDefault('America/Santiago');
      const css = fs.readFileSync(path.join(__dirname, '../../../../../views/') + 'form/carDetail/style.css', 'utf8');
      const templatePath: string = path.join(__dirname, '../../../../../views/') + context.template; // 'form/carDetail/index.pug';
      const html = GeneralUtils.generateHtmlFromPugFile(templatePath, {
        ...payload,
        ...answers,
        ...context,
        css: css.replace(/(\r\n|\n|\r)/gm, ''),
        moment,
        origin: () => {
          if (participant.reception && participant.receiveFrom) {
            return participant.receiveFrom.name;
          }
          if (participant.shipping && participant.venue) {
            return participant.venue.name;
          }
          return false;
        },
        destination: () => {
          if (participant.reception && participant.venue) {
            return participant.venue.name;
          }
          if (participant.shipping && participant.sendTo) {
            return participant.sendTo.name;
          }
          return false;
        },
        carrier: () => {
          if (participant.carrier && participant.carrierBy) {
            return participant.carrierBy.name;
          }
          return false;
        },
        getAnswer: ((scale: any, answer: any) => {
          if (answer && answer.hasOwnProperty('answer') && answer.answer) {
            const choice = scale.choices.find((choice: any) => choice._id.toString() === answer.answer.toString());
            return choice ? choice.choice : '';
          }
          return '';
        }),
        requireAccesory: ((scale: any, answer: any) => {
          if (answer && answer.hasOwnProperty('answer') && answer.answer) {
            const choice = scale.choices.find((choice: any) => choice._id.toString() === answer.answer.toString());
            return choice ? choice.requireAccesories : false;
          }
          return false;
        }),
        getDamageItem: ((items: any, item: string) => {
          if (item) {
            const result = items.find((i: any) => i._id.toString() === item.toString());
            if (result && result.hasOwnProperty('name')) {
              return result.name;
            }
          }
          return '-';
        }),
        logo: participantCompany.image && participantCompany.image.hasOwnProperty('url') ? decodeURI(participantCompany.image.url) : false,
        accesorySelected: (answer: any, item: any) => {
          return item && answer.accesoriesAnswered ? answer.accesoriesAnswered.find((accesory: any) => {
            return accesory.item === item._id.toString();
          }) : false;
        }
      });

      const pdfPath = await this.createPDF(html, filename);
      const url = await this.uploadFile(pdfPath, filename);

      if (payload?.files) {
        payload.files.push({ filename, path: url });
      } else {
        payload['files'] = [{ filename, path: url }];
      }
      logger.info(`FileTriggerDelegate.trigger: files ${JSON.stringify(payload['files'])}`);
      logger.info(`FileTriggerDelegate.trigger: ${trigger.kind} executed`);
      return payload;
    } catch (e) {
      logger.error(e);
      return payload;
    }
  }

  private async createPDF(html: string, filename: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const path = `/tmp/${filename}`;
        // launch a new chrome instance
        const browser = await puppeteer.launch({
          args: ['--no-sandbox', '--allow-file-access-from-files', '--enable-local-file-accesses'], // Required.
          headless: true,
        });

        // create a new page
        const page = await browser.newPage();

        await page.setContent(html, {
          waitUntil: 'networkidle0'
        })

        await page.pdf({
          path,
          format: 'Letter',
          printBackground: true,
          margin: {
            top: '0.3in',
            right: '0.5in',
            bottom: '0.3in',
            left: '0.5in'
          }
        })
        await browser.close();
        resolve(path);
      } catch (err) {
        reject(err);
      }
    });
  }

  private async uploadFile(filePath: string, filename: string): Promise<any> {
    try {
      AWS.config.update({
        accessKeyId: process.env.S3_KEY || s3Config.accessKeyId,
        secretAccessKey: process.env.S3_SECRET || s3Config.secretAccessKey,
        region: process.env.S3_REGION || s3Config.region // defaults to us-standard
      });

      let s3 = new AWS.S3({
        bucket: process.env.S3_BUCKET || s3Config.bucket,
        acl: 'public-read', // defaults to public-read
        region: process.env.S3_REGION || s3Config.region // defaults to us-standard
      } as any);

      let data: Buffer = await fs.readFileSync(filePath);
      let s3FileOptions: AWS.S3.Types.PutObjectRequest = {
        Key: `/tmp/${filename}`,
        Bucket: process.env.S3_BUCKET || s3Config.bucket,
        ACL: 'public-read',
        Body: data
      };

      const upload = () => new Promise(((resolve, reject) => {
        s3.upload(s3FileOptions, (err, data) => {
          if (err) {
            reject(err);
          } else {
            resolve(data.Location);
          }
        });
      }));
      return await upload();
    } catch (e) {
      logger.error(e.stack);
      return '';
    }
  }
}
