import { ITriggerDelegate } from '../../../interfaces/trigger.interfaces';
import { IFormTriggerModel } from '../../../models/trigger.model';
import logger from '../../../../services/logger.service';

export default class NullTriggerDelegate implements ITriggerDelegate {

  processTrigerConfig(trigger: IFormTriggerModel, answers: any): any {
    let data: any = {};
    Object.keys(trigger.config.toJSON()).map((k: string) => {
      data[k] = answers.hasOwnProperty(trigger.config[k].toString()) ?
        answers[trigger.config[k].toString()] : trigger.config[k].toString();
    });
    return data;
  }

  trigger(trigger: IFormTriggerModel, answers: any, payload: any): any {
    logger.error(`Kind Trigger: ${trigger.kind} not implemented `);
  }
}
