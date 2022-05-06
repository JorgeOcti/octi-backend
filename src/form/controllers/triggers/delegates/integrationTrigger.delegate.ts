import NullTriggerDelegate from './nullTrigger.delegate';
import { IFormTriggerModel } from '../../../models/trigger.model';
import logger from '../../../../services/logger.service';
import { IAnyObject } from '../../../../interfaces/global.interface';
import Axios from 'axios';

export default class IntegrationDelegate extends NullTriggerDelegate {

  public async trigger(trigger: IFormTriggerModel, answers: IAnyObject, payload: IAnyObject): Promise<any> {
    try {
      logger.info(`Kind Trigger: ${trigger.kind} performing`);

      let context = this.processTrigerConfig(trigger, {
        ...answers
      });
      logger.info(`Kind Trigger: context =>${JSON.stringify(context)}`);
      logger.info(`Kind Trigger: integrationType =>${context.integrationType}`);
      const { participant } = payload;
      const apiInstance = Axios.create({
        ...this.parseHeader(context.header)
      });
      await apiInstance.post(context.url, { ...this.parseBody(context.body), ...participant });

      return payload;
    } catch (e) {
      console.error('IntegrationDelegate: trigger');
      console.error(e);
    }
  }

  private parseHeader(header: string): any {
    if (header?.length) {
      return {
        headers: header
      };
    }
    return {};
  }

  private parseBody(body: string) {
    if(body?.length) {
      try {
        return JSON.parse(body);
      } catch (e) {
        console.error('IntegrationDelegate: parseBody');
        console.error(e);
        return {};
      }
    } else{
      return {};
    }
  }
}
