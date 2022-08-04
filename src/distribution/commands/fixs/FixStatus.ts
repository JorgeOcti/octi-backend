import * as bluebird from 'bluebird';
import * as dotenv from 'dotenv';
import * as mongoose from 'mongoose';
import * as path from 'path';
import Milestone, { ChoicesStepMilestone } from '../../models/milestone.model';
import Team from '../../../app/models/team.model';
import TransmittalItem from '../../models/transmittalItem.model';
import RequestItem from '../../../request/models/requestItem.model';
import Transmittal from '../../models/transmittal.model';
import Participant from '../../../form/models/participant.model';

// import ActivityHistory, { ChoicesTypeActivity } from '../models/activityHistory.model';

async function fixStatus() {
  try {
    dotenv.config({
      path: path.join(__dirname, '../../../.env')
    });
    const MONGODB_URI: string = process.env.MONGODB_URI || '';
    (mongoose as any).Promise = bluebird;
    await mongoose.connect(MONGODB_URI, {useNewUrlParser: true, useUnifiedTopology: true});
    mongoose.set('debug', true);
    const teams = await Team.find({});
    if(false){
      await Participant.find({_id: null});
    }
    for (const team of teams) {
      console.log(team.name);
      const checkItem = await Milestone.findOne({
        step: ChoicesStepMilestone.checkItem,
        team
      });
      if(checkItem && checkItem?.requestItemStatus){
        const transmittalItems = await TransmittalItem.find({
          team,
          revisions: { $exists: true, $not: {$size: 0} }
        });
        for(const transmittalItem of transmittalItems){
          await RequestItem.findOneAndUpdate({ transmittalItem }, { $set: { status: checkItem.requestItemStatus } });
        }
      }

      const finishTransmittal = await Milestone.findOne({
        step: ChoicesStepMilestone.finishTransmittal,
        team
      });
      if (finishTransmittal && finishTransmittal?.requestItemStatus) {
        const transmittals = await Transmittal.find({
          team
        }).populate([{
          path: 'revision',
          select: ['_id']
        }]);
        for (const transmittal of transmittals) {
          if (transmittal.revision) {
            await RequestItem.updateMany({ transmittal }, { $set: { status: finishTransmittal.requestItemStatus } });
          }
        }
      }

    }
  } catch (e) {
    console.log(e);
    process.exit(1);
  }
  process.exit(1);
}

fixStatus();
