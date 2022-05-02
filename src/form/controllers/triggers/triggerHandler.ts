import { IForm } from '../../interfaces/form.interface';
import { IParticipant, IParticipantAnswer } from '../../interfaces/participant.interface';
import ParticipantModel from '../../models/participant.model';
import logger from '../../../services/logger.service';
import { IFormTriggerModel } from '../../models/trigger.model';
import { KindQuestion } from '../../models/form.model';
import { ITriggerDelegate } from '../../interfaces/trigger.interfaces';
import NullTriggerDelegate from './delegates/nullTrigger.delegate';
import EmailTriggerDelegate from './delegates/emailTrigger.delegate';
import FileTriggerDelegate from './delegates/fileTrigger.delegate';
import { IAnyObject } from '../../../interfaces/global.interface';
import RequestDelegate from './delegates/requestTrigger.delegate';
import IntegrationDelegate from './delegates/integrationTrigger.delegate';
import { KindTrigger } from '../../models/trigger.types';

export default class TriggerHandler {
  private form: IForm;
  private participant: IParticipant | null;
  private readonly answers: any;

  constructor(form: IForm, participant: IParticipant, answers?: IParticipantAnswer[]) {
    this.form = form;
    this.participant = participant;
    this.answers = answers ? answers : this.getAnswers();
  }

  public async execute(payload: IAnyObject = {}): Promise<any> {
    await this.getParticipantFullData();
    for (const trigger of this.form.triggers) {
      if (!trigger.enabled) {
        logger.info(`Trigger: ${trigger.name} deactivated`);
        continue;
      }
      let triggerDelegate: ITriggerDelegate = this.getTrigger(trigger);
      payload = await triggerDelegate.trigger(trigger, this.answers, {
        ...payload,
        participant: this.participant,
        responsible: this.participant?.venue.responsible,
        user: {
          ...this.participant!.user,
          fullName: `${this.participant!.user.firstName} ${this.participant!.user.lastName}`
        }
      });
    }
  }

  private getTrigger(trigger: IFormTriggerModel): ITriggerDelegate {
    const delegates: any = {
      [KindTrigger.email]: new EmailTriggerDelegate(),
      [KindTrigger.file]: new FileTriggerDelegate(),
      [KindTrigger.request]: new RequestDelegate(),
      [KindTrigger.integration]: new IntegrationDelegate()
    };
    return delegates[trigger.kind] ?? new NullTriggerDelegate();
  }

  private getAnswers(): IAnyObject {
    let answers: IAnyObject  = {};
    this.participant!.sections.forEach((section) => {
      section.answers.forEach((answer) => {
        answers[answer._id.toString()] = answer.kind === KindQuestion.image ? answer.images : answer.comment;
      });
    });
    return answers;
  }

  private async getParticipantFullData(): Promise<any> {
    this.participant = await ParticipantModel
      .findOne({
        _id: this.participant!._id
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
        select: ['name', 'responsible'],
        populate: [{
          path: 'responsible',
          select: ['firstName', 'lastName', 'email']
        }]
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
}
