import * as bluebird from 'bluebird';
import * as dotenv from 'dotenv';
import * as mongoose from 'mongoose';
import * as path from 'path';
import Form from '../../form/models/form.model';
import Participant from '../../form/models/participant.model';

async function fixAccesories() {
  dotenv.config({
    path: path.join(__dirname, '../../../.env')
  });
  const MONGODB_URI: string = process.env.MONGODB_URI || '';
  (mongoose as any).Promise = bluebird;
  await mongoose.connect(MONGODB_URI, {useMongoClient: true});
  mongoose.set('debug', true);
  const participants = await Participant.find({});
  for (const participant  of participants) {
    for (const section  of participant.sections) {
      for (const answer  of section.answers) {
        if (answer.accessories) {
          for (const item  of answer.accessories.items) {
            item.amount = false;
          }
        }
        if (answer.accesoriesSelected && answer.accesoriesSelected.length) {
          for (const accesorySelected  of answer.accesoriesSelected) {
            if (!answer.accesoriesAnswered.length) {
              answer.accesoriesAnswered.push({
                item: accesorySelected,
                amount: 1
              });
            }
          }
        }
      }
    }
    await participant.save();
  }
  const forms = await Form.find({});
  for (const form  of forms) {
    for (const section  of form.sections) {
      for (const question  of section.questions) {
        if (question.accessories) {
          for (const item  of question.accessories.items) {
            item.amount = false;
          }
        }
      }
    }
    await form.save();
  }
  process.exit(1);
}

fixAccesories();
