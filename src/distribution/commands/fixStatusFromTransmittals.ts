import * as bluebird from 'bluebird';
import * as dotenv from 'dotenv';
import * as mongoose from 'mongoose';
import * as path from 'path';
import RequestItem from "../../request/models/requestItem.model";
import TransmittalItem from "../models/transmittalItem.model";
import Transmittal from "../models/transmittal.model";
import Milestone, {ChoicesStepMilestone} from "../models/milestone.model";
import Participant from "../../form/models/participant.model";
import { ChoicesStatusTransmittal } from '../models/transmitall.types';

async function fixStatus() {
  try {
    dotenv.config({
      path: path.join(__dirname, '../../../.env')
    });
    const MONGODB_URI: string = process.env.MONGODB_URI || '';
    (mongoose as any).Promise = bluebird;
    await mongoose.connect(MONGODB_URI, {useNewUrlParser: true, useUnifiedTopology: true});
    mongoose.set('debug', true);

    const transmitalItems = await TransmittalItem.find({requestItem: {$ne: null}, revisions: {$ne: []}});
    for (const transmitalItem of transmitalItems) {
      const transmittal = await Transmittal.findOne({_id: transmitalItem['transmittal'].toString()});
      let requestItem = await RequestItem.findOne({_id: transmitalItem['requestItem'].toString()});
      if (!requestItem || !transmittal)
        continue

      if (transmittal.status === ChoicesStatusTransmittal.completed) {
        const milestone = await Milestone.findOne({
          type: transmittal.type,
          step: ChoicesStepMilestone.finishTransmittal
        })

        if (milestone){
          requestItem.status = milestone.requestItemStatus;
          requestItem.save();
        }

      } else {
        for (const revision of transmitalItem.revisions){
          const participant = await Participant.findOne({_id: revision.toString()});
          if (!participant)
            continue

          const milestone = await Milestone.findOne({
            type: transmittal.type,
            step: ChoicesStepMilestone.checkItem,
            form: participant.form.toString()
          })

          if (milestone){
            requestItem.status = milestone.requestItemStatus;
            requestItem.save();
          }
        }
      }
    }
    console.log("Done");
  } catch (e) {
    console.log(e);
    process.exit(1);
  }
  process.exit(0);
}


fixStatus() ;
