import {IForm} from "../../interfaces/form.interface";
import {IParticipant} from "../../interfaces/participant.interface";
import ParticipantModel from "../models/participant.model";
import logger from '../../services/logger.service';
import {IFormTriggerModel, KindTrigger} from "../models/trigger.model";
import { queue } from '../../app';
import * as HtmlPdf from 'html-pdf';
import * as fs from 'fs';
import * as path from 'path';
import GeneralUtils from "../../utils/general.utils";
import * as moment from 'moment-timezone';
import {KindQuestion} from "../models/form.model";
import ParticipantFile from "../models/participantFile.model";


export default class TriggerHandler {
  private form: IForm
  private participant: IParticipant
  private readonly answers: any

  constructor(form: IForm, participant: IParticipant, answers?: any) {
    this.form = form;
    this.participant = participant;
    this.answers = answers ? answers :this.getAnswers();
  }

  async getParticipantFullData(){
    this.participant = await ParticipantModel
      .findOne({
        _id: this.participant._id,
      }, {
        name: true,
        number: true,
        user: true,
        sections: true,
        qualification: true,
        shipping: true,
        shippingText: true,
        shippingImages: true,
        carrier: true,
        reception: true,
        receptionText: true,
        receptionImages: true,
        conciliation: true,
        conciliationText: true,
        conciliationImages: true,
        createdAt: true
      })
      .populate([{
        path: 'user',
        select: ['firstName', 'lastName', 'venue', 'email'],
        populate: [{
          path: 'venue',
          populate: [{
            path: 'company'
          }]
        }]
      }, {
        path: 'receiveFrom',
        select: 'name'
      }, {
        path: 'venue',
        select: 'name'
      }, {
        path: 'sendTo',
        select: 'name'
      }, {
        path: 'carrierBy',
        select: 'name'
      }, {
        path: 'car',
        select: ['vin', 'internalNumber', 'engineNumber', 'brand', 'denomination', 'color', 'patent']
      }, {
        path: 'sections.answers.images'
      }, {
        path: 'shippingImages'
      }, {
        path: 'receptionImages'
      }, {
        path: 'conciliationImages'
      }]).lean();
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

  public async execute(payload : any = {}) {
    await this.getParticipantFullData();
    for (const trigger : IFormTriggerModel of this.form.triggers){
      if (!trigger.enabled){
        logger.info(`Trigger: ${trigger.name} deactivated`);
        continue;
      }

      let triggerDelegate : ITriggerDelegate = this.getTrigger(trigger);
      payload = await triggerDelegate.trigger(trigger, this.answers, {...payload, participant: this.participant, user: this.participant.user});
    }
  }

  private getTrigger(trigger: IFormTriggerModel) : ITriggerDelegate {
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

  private validateEmail(email: string) {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  }

  trigger(trigger: IFormTriggerModel, answers: any, payload: any): any {
    logger.info(`Kind Trigger: ${trigger.kind} performing`)
    let data = this.processTrigerConfig(trigger, {...answers, ...payload.user})
    if (!this.validateEmail(data.email))
      return payload;

    queue.create('email', {
      from: '',
      title: `"${data.subject} | ${data.fullname}`,
      to: `"${data.fullname}"<${data.email}>`,
      subject: `${data.subject}`,
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

    data.signature = (await ParticipantFile.find({_id: {$in: data.signature}})).map(f => f.file.url)[0];
    moment.locale('es');
    moment.tz.setDefault('America/Santiago');
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

    const createPDF = (html, options) => new Promise(((resolve, reject) => {
      HtmlPdf.create(html, options).toStream((err : Error, stream ) => {
        if (err !== null) {reject(err);}
        else {resolve(stream);}
      });
    }));
    const PDF = await createPDF(html, config);

    if (payload.hasOwnProperty('files')){
      payload.file.push({filename, content: PDF});
    } else {
      payload['files'] = [{filename, content: PDF}];
    }
    return payload;
  }
}
