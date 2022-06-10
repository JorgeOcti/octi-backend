import NullTriggerDelegate from './nullTrigger.delegate';
import { IFormTriggerModel } from '../../../models/trigger.model';
import logger from '../../../../services/logger.service';
import { queue } from '../../../../app';
import { IAnyObject } from '../../../../interfaces/global.interface';

export default class EmailTriggerDelegate extends NullTriggerDelegate {

  private validateEmail(email: string): boolean {
    const re = /^\w+([\\.-]?\w+)*@\w+([\\.-]?\w+)*(\.\w{2,3})+$/;
    return re.test(email.toLowerCase());
  }

  public trigger(trigger: IFormTriggerModel, answers: IAnyObject, payload: IAnyObject): IAnyObject {
    try {
      logger.info(`EmailTriggerDelegate.trigger: ${trigger.kind} performing`);

      let context = this.processTrigerConfig(trigger, {
        ...answers,
        ...payload.user
      });
      logger.debug(`EmailTriggerDelegate.trigger context => ${JSON.stringify(context)}`);
      // logger.debug(`EmailTriggerDelegate.trigger payload => ${JSON.stringify(payload)}`);

      if (
        (trigger.config.responsible && !payload.responsible?.length) ||
        (!trigger.config.responsible && !this.validateEmail(context.email))
      ) {
          logger.debug(`EmailTriggerDelegate.trigger emai no cumple requisitos.`);
        return payload;
      }

      let recipients: string | string[];

      if (trigger.config.responsible) {
        recipients = payload.responsible.map((obj: any) => `"${obj.firstName} ${obj.lastName}"<${obj.email}>`);
      } else {
        recipients = `"${context.fullname}"<${context.email}>`;
      }

      queue.create('email', {
        from: '',
        title: `"${context.subject} | ${context.fullname}`,
        to: recipients,
        subject: `${trigger.config.subject}`,
        text: ``,
        attachments: payload.files || [],
        view: trigger.config.template,
        context: {
          ...payload,
          ...context,
          ...answers
        }
      }).priority('high').attempts(5).save();

      logger.info(`EmailTriggerDelegate.trigger ${trigger.kind} executed`);

      return payload;
    } catch (e) {
      logger.error(e);
      return payload;
    }
  }
}
