import * as bluebird from 'bluebird';
import * as dotenv from 'dotenv';
import * as mongoose from 'mongoose';
import * as path from 'path';
import Form, {KindQuestion} from '../models/form.model';

async function createDamage() {
  dotenv.config({
    path: path.join(__dirname, '../../../.env')
  });
  const MONGODB_URI: string = process.env.MONGODB_URI || '';
  (mongoose as any).Promise = bluebird;
  await mongoose.connect(MONGODB_URI, {});
  mongoose.set('debug', true);
  const forms = await Form.find({});
  for (const form of forms) {
    for (const section of form.sections) {
      for (const question of section.questions) {
        console.log('--------------------------');
        console.log(question.accessories);
        if (question.accessories) {
          question.kind = KindQuestion.accessory;
        } else if (question.damages) {
          question.kind = KindQuestion.damage;
        } else if (question.scale) {
          question.kind = KindQuestion.scale;
        } else {
          console.log('ERROR');
        }
      }
    }
    await form.save();
  }
  process.exit(1);
}

createDamage();
