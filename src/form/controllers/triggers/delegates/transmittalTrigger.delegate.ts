import NullTriggerDelegate from "./nullTrigger.delegate";
import {IFormTriggerModel} from "../../../models/trigger.model";
import { IAnyObject } from '../../../../interfaces/global.interface';
import logger from "../../../../services/logger.service";
import TransmittalItem from "../../../../distribution/models/transmittalItem.model";
import Transmittal from "../../../../distribution/models/transmittal.model";
import {ChoicesStatusTransmittal} from "../../../../distribution/models/transmitall.types";
import * as mongoose from 'mongoose';

export default class TransmittalTriggerDelegate extends NullTriggerDelegate {

  public async trigger(trigger: IFormTriggerModel, answers: IAnyObject, payload: IAnyObject) {
    try {
      logger.info(`TransmittalTriggerDelegate.trigger: ${trigger.kind} performing`);

      let transmittalTypes = trigger.config.transmittalTypes.map((tt: string) => mongoose.Types.ObjectId(tt))
      let car = payload.participant.car

      let transmittalItems = await TransmittalItem.aggregate([{$match: {
        car: mongoose.Types.ObjectId(car._id),
      }}, {$lookup: {
          from: 'transmittals',
          localField: 'transmittal',
          foreignField: '_id',
          as: 'transmittal_data'
        }
      }, {$match: {
          "transmittal_data.status": {$nin: [ChoicesStatusTransmittal.completed, ChoicesStatusTransmittal.completed_by_reception ]},
          "transmittal_data.type": {$in: transmittalTypes},
        }}]);

      for (const transmittalItem of transmittalItems){
        await TransmittalItem.update({_id: transmittalItem._id}, {$set: {arrivalDate: Date.now()}})

        let allItems = await TransmittalItem.count({
          transmittal: transmittalItem.transmittal,
          arrivalDate: null
        });

        if (allItems == 0){
          await Transmittal.update({
            _id: transmittalItem.transmittal},
            { $set: { status:  ChoicesStatusTransmittal.completed_by_reception}
          })
        }
      }

      return payload;
    } catch (e) {
      logger.error(e);
      return payload;
    }
  }
}
