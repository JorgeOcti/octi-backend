import NullTriggerDelegate from './nullTrigger.delegate';
import { IFormTriggerModel } from '../../../models/trigger.model';
import logger from '../../../../services/logger.service';
import { queue } from '../../../../app';

export default class EmailTriggerDelegate extends NullTriggerDelegate {

  private validateEmail(email: string) {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  }

  trigger(trigger: IFormTriggerModel, answers: any, payload: any): any {
    logger.info(`Kind Trigger: ${trigger.kind} performing`);
    let data = this.processTrigerConfig(trigger, { ...answers, ...payload.user });

    if (!this.validateEmail(data.email)) {
      return payload;
    }

    logger.info(`Kind Trigger: data =>${JSON.stringify(data)}`);

    queue.create('email', {
      from: '',
      title: `"${data.subject} | ${data.fullname}`,
      to: `"${data.fullname}"<${data.email}>`,
      subject: `${data.subject}`,
      text: ``,
      attachments: payload.files || [],
      view: trigger.config.template,
      context: {
        ...payload,
        ...data,
        ...answers
      }
    }).priority('high').attempts(5).save();
    return payload;
  }
}
