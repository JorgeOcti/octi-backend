import { ITriggerDelegate } from '../../../interfaces/trigger.interfaces';
import { IFormTriggerModel } from '../../../models/trigger.model';
import logger from '../../../../services/logger.service';
import { IAnyObject } from '../../../../interfaces/global.interface';

export default class NullTriggerDelegate implements ITriggerDelegate {

  public processTrigerConfig(trigger: IFormTriggerModel, payload: IAnyObject): IAnyObject {
    logger.info(`Kind Trigger: processTrigerConfig`);

    let context: IAnyObject = {};
    Object.keys(trigger.config?.toObject() ?? {}).map((configKey: string) => {
      logger.debug(`Kind Trigger: configKey ${configKey} => ${trigger.config[configKey]}`, );
      context[configKey] = payload.hasOwnProperty(trigger.config[configKey])
        ? (
          payload[trigger.config[configKey]]
        )
        : (
          trigger.config[configKey]
        );
    });

    logger.info(`Kind Trigger: context ${JSON.stringify(context)}`);
    return context;
  }

  public trigger(trigger: IFormTriggerModel, answers: IAnyObject, payload: IAnyObject): void {
    logger.error(`Kind Trigger: ${trigger.kind} not implemented `);
  }
}
