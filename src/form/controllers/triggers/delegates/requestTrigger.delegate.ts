import NullTriggerDelegate from './nullTrigger.delegate';
import { IFormTriggerModel } from '../../../models/trigger.model';
import logger from '../../../../services/logger.service';
import { IAnyObject } from '../../../../interfaces/global.interface';
import RequestItem from '../../../../request/models/requestItem.model';
import RequestController from '../../../../request/controllers/request.controller';
import User from '../../../../app/models/user.model';
import { io } from '../../../../server';

export default class RequestDelegate extends NullTriggerDelegate {

  public async trigger(trigger: IFormTriggerModel, answers: IAnyObject, payload: IAnyObject): Promise<any> {
    try {
      logger.info(`Kind Trigger: ${trigger.kind} performing`);

      const context = this.processTrigerConfig(trigger, {
        ...answers
      });
      logger.info(`Kind Trigger: context =>${JSON.stringify(context)}`);

      const { participant, user } = payload;
      const { car } = participant;

      const currentUser = await User.findOne({ _id: user._id });
      const requestItem = await RequestItem
        .findOneAndUpdate(
          { car, team: currentUser!.team },
          { $set: { status: context.requestItemStatus } },
          { new: true, sort: { _id: -1 } }
        )
        .populate(RequestController.itemPopulate);

      if (requestItem) {
        io.to(`request-list-${currentUser!.team}`).emit('UPDATE_REQUEST_ITEM', {
          idRequest: requestItem.request._id,
          item: requestItem
        });
        io.to(`request-detail-${currentUser!.team}`).emit('UPDATE_REQUEST_ITEM', {
          idRequest: requestItem.request._id,
          item: requestItem
        });
      }

      return payload;
    } catch (e) {
      console.error(e);
    }
  }
}
