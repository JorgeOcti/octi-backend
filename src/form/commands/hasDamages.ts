import * as bluebird from 'bluebird';
import * as dotenv from 'dotenv';
import Participant from '../models/participant.model';
import * as mongoose from 'mongoose';
import * as path from 'path';

async function updateVin2() {
  dotenv.config({
    path: path.join(__dirname, '../../../.env')
  });
  const MONGODB_URI: string = process.env.MONGODB_URI || '';
  (mongoose as any).Promise = bluebird;
  await mongoose.connect(MONGODB_URI,  {useNewUrlParser: true,  useUnifiedTopology: true});
  const cursor = await Participant.find({}).batchSize(100).cursor();

  cursor.on('data', async (participant) => {
    console.log(participant.number);
    // let hasDamages = false;
    // for (const section  of participant.sections) {
    //   for (const answer  of section.answers) {
    //     console.log(answer.damagesSelected);
    //     if(!hasDamages && answer.damagesSelected.length){
    //       hasDamages = true;
    //     }
    //   }
    // }
    // participant.hasDamages = hasDamages;
    participant.hasDamages = participant.sections.some((section: any) => {
      return section.answers.some((answer: any) => {
        return answer.damagesSelected.length > 0;
      });
    });
    participant.save();
  });

  cursor.on('end', async ()  => {
    process.exit(1);
  });
}

updateVin2();
