import type { IFormTriggerModel } from '../models/trigger.model';

export interface ITriggerDelegate {
  trigger(trigger: IFormTriggerModel, answers: any, payload: any): any;
}
