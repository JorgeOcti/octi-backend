import * as bluebird from 'bluebird';
import * as dotenv from 'dotenv';
import * as mongoose from 'mongoose';
import * as path from 'path';

import Participant from '../models/participant.model';

async function updateVin2() {
  dotenv.config({
    path: path.join(__dirname, '../../../.env')
  });
  const MONGODB_URI: string = process.env.MONGODB_URI || '';
  (mongoose as any).Promise = bluebird;
  mongoose.set('debug', true);
  await mongoose.connect(MONGODB_URI, {});
  const cursor = await Participant.find({}).cursor();

  await cursor.eachAsync(async (participant) => {
    console.log(participant._id);
    try {
      let hasDamages = false;
      for (const section of participant.sections) {
        for (const answer of section.answers) {
          // console.log(answer.damagesSelected);
          if (!hasDamages && answer.damagesSelected.length) {
            hasDamages = true;
          }
        }
      }
      console.log(hasDamages);
      await Participant.updateOne({ _id: participant._id }, { $set: { hasDamages } });
    } catch (error) {
      console.log("error");
    }
    // participant.hasDamages = hasDamages;
    // try {
    //   const hasDamages = participant.sections.some((section: any) => {
    //     return section.answers.some((answer: any) => {
    //       return answer.damagesSelected.length > 0;
    //     });
    //   });
    //   console.log(participant.hasDamages);
    //   await Participant.updateOne({_id: participant}, {$set: {hasDamages}});
    // } catch (error) {
    //   console.log(error);
    // }
  });

  process.exit(1);
}

updateVin2();
