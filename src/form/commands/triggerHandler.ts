import {IForm} from "../../interfaces/form.interface";
import {IParticipant, IParticipantAnswer, IParticipantSection} from "../../interfaces/participant.interface";
import {IParticipantAnswerModel} from "../models/participant.model";
import logger from '../../services/logger.service';
import {IFormTriggerModel, KindTrigger} from "../models/trigger.model";
import { queue } from '../../app';
import * as HtmlPdf from 'html-pdf';
import * as fs from 'fs';
import * as path from 'path';
import GeneralUtils from "../../utils/general.utils";
import * as moment from 'moment';
import * as QRCode from "qrcode";
import {KindQuestion} from "../models/form.model";
import ParticipantFile from "../models/participantFile.model";


export default class TriggerHandler {
  private form: IForm
  private participant: IParticipant
  private answers: any

  constructor(form: IForm, participant: IParticipant, answers?: any) {
    this.form = form;
    this.participant = participant;
    this.answers = answers ? answers :this.getAnswers();
  }

  getAnswers() : any {
    let answers = {}
    this.participant.sections.map( (s) => {
      s.answers.map( a => {
        answers[a._id.toString()] = a.kind === KindQuestion.image ? a.images : a.comment
      })
    })

    return answers;
  }

  public execute(payload : any = {}) {
    this.form.triggers.reduce((payload : any, trigger: IFormTriggerModel) => {
      return this.executeTrigger(trigger).trigger(trigger, this.answers, {...payload, participant: this.participant});
    } , payload);
  }

  private executeTrigger(trigger: IFormTriggerModel) : ITriggerDelegate {
    let delegate = new NullTriggerDelegate();
    switch (trigger.kind) {
      case KindTrigger.email: {
        delegate = new EmailTriggerDelegate();
        break;
      }
      case KindTrigger.file: {
        delegate = new FileTriggerDelegate();
        break;
      }
    }

    return delegate;
  }

}

interface ITriggerDelegate {
  trigger(trigger: IFormTriggerModel, answers: any, payload: any): any

}

class NullTriggerDelegate implements  ITriggerDelegate {
  processTrigerConfig(trigger: IFormTriggerModel, answers: any): any {
    let data = {};
    logger.info(JSON.stringify(answers))
    logger.info(JSON.stringify(trigger.config))
    logger.info(JSON.stringify(Object.keys(trigger.config.toJSON())))
    Object.keys(trigger.config.toJSON()).map( (k: string) => {
      data[k] = answers.hasOwnProperty(trigger.config[k].toString()) ?
        answers[trigger.config[k].toString()] : trigger.config[k].toString();
    })
    return data;
  }

  trigger(trigger: IFormTriggerModel, answers: any, payload: any): any {
    logger.error(`Kind Trigger: ${trigger.kind} not implemented `)
  }
}

class EmailTriggerDelegate extends NullTriggerDelegate{

  trigger(trigger: IFormTriggerModel, answers: any, payload: any): any {
    logger.info(`Kind Trigger: ${trigger.kind} performing`)
    logger.info(trigger.config.template)
    let data = this.processTrigerConfig(trigger, answers)
    queue.create('email', {
      from: '',
      title: `Welcome email for ${data.fullname}`,
      to: `"${data.fullname}"<${data.email}>`,
      subject: `${data.fullname} bienvenido(a) a OSA Andes`,
      text: ``,
      attachments: payload.files || [],
      view: trigger.config.template,
      context: {
        ...data,
        ...answers,
      }
    }).priority('high').attempts(5).save();
    return payload;
  }
}

class FileTriggerDelegate extends NullTriggerDelegate {

  async trigger(trigger: IFormTriggerModel, answers: any, payload: any): any {
    logger.info(`Kind Trigger: ${trigger.kind} performing`);
    let data = this.processTrigerConfig(trigger, answers);
    let filename = `${moment().unix()}_${data.filename}`;
    let filePath = `/tmp/${filename}`;
    let participant = payload.participant;
    const participantCompany = participant.user.venue && participant.user.venue.company || {};

    const config: HtmlPdf.CreateOptions = {
      directory: '/tmp',
      format: 'Letter',
      orientation: 'portrait',
      border: {
        top: '0.3in',
        right: '0.5in',
        bottom: '0.3in',
        left: '0.5in'
      },
      type: 'pdf',
      quality: '75'
    };

    logger.info("DATA:" + JSON.stringify(data))
    data.signature = (await ParticipantFile.find({_id: {$in: data.signature}})).map(f => f.file.url)[0];

    logger.info("DATA:" + JSON.stringify(data))
    const css = fs.readFileSync(path.join(__dirname, '../../../views/') + 'form/carDetail/style.css', 'utf8');
    const templatePath: string = path.join(__dirname, '../../../views/') + data.template // 'form/carDetail/index.pug';
    const html = GeneralUtils.generateHtmlFromPugFile(templatePath, {
      ...payload,
      ...answers,
      ...data,
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
    await HtmlPdf.create(html, config).toFile(filePath)
    // });

    if (payload.hasOwnProperty('files')){
      payload.file.push({filename, path: filePath});
    } else {
      payload['files'] = [{filename, path: filePath}];
    }
    return payload;
  }
}
