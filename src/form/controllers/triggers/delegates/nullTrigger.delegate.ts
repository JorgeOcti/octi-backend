import { ITriggerDelegate } from '../../../interfaces/trigger.interfaces';
import { IFormTriggerModel } from '../../../models/trigger.model';
import logger from '../../../../services/logger.service';
import { IAnyObject } from '../../../../interfaces/global.interface';

export default class NullTriggerDelegate implements ITriggerDelegate {

  public processTrigerConfig(trigger: IFormTriggerModel, payload: IAnyObject): IAnyObject {
    logger.info(`NullTriggerDelegate.processTrigerConfig: ${trigger.kind} performing`);

    let context: IAnyObject = {};
    Object.keys(trigger.config?.toObject() ?? {}).map((configKey: string) => {
      logger.debug(`NullTriggerDelegate.processTrigerConfig: configKey ${configKey} => ${trigger.config[configKey]}`, );
      context[configKey] = payload.hasOwnProperty(trigger.config[configKey])
        ? (
          payload[trigger.config[configKey]]
        )
        : (
          trigger.config[configKey]
        );
    });
    logger.debug(`NullTriggerDelegate.NullTriggerDelegate context => ${JSON.stringify(context)}`);
    logger.info(`NullTriggerDelegate.trigger ${trigger.kind} executed`);
    return context;
  }

  public trigger(trigger: IFormTriggerModel, answers: IAnyObject, payload: IAnyObject): void {
    logger.info(`NullTriggerDelegate.trigger ${trigger.kind} not implemented`);
  }
}
