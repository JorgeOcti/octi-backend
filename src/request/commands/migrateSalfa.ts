import * as bluebird from 'bluebird';
import * as dotenv from 'dotenv';
import * as mongoose from 'mongoose';
import * as path from 'path';
import Team from '../../app/models/team.model';
import RequestItem from '../../request/models/requestItem.model';
import Request from '../../request/models/request.model';

async function migrateSalfa() {
  dotenv.config({
    path: path.join(__dirname, '../../../.env')
  });
  const MONGODB_URI: string = process.env.MONGODB_URI || '';
  (mongoose as any).Promise = bluebird;
  await mongoose.connect(MONGODB_URI,{ useNewUrlParser: true, useUnifiedTopology: true });
  mongoose.set('debug', true);
  try {
    const team = await Team.findById('5bf2de35caf8ef7096105cdd');
    const requestItems = await RequestItem.find({team});
    for (const requestItem of requestItems) {
      try {
        const answerByKey = requestItem.answers.reduce((acc: any, cur: any) => {
          return {
            ...acc,
            [cur.questionId.toString()]: cur
          };
        }, {});
        await Request.findByIdAndUpdate(requestItem.request, {
          customerInformation: {
            name: answerByKey.hasOwnProperty('5bf2de35caf8ef7096105c21') ? answerByKey['5bf2de35caf8ef7096105c21'].answer : '',
            rut: answerByKey.hasOwnProperty('5bf2de35caf8ef7096105c22') ? answerByKey['5bf2de35caf8ef7096105c22'].answer : '',
            email: answerByKey.hasOwnProperty('60b9232164adc90013a79b45') ? answerByKey['60b9232164adc90013a79b45'].answer : '',
            phone: ''
          },
          advancePaymentInformation: {
            method: answerByKey.hasOwnProperty('5bf2de35caf8ef7096105c23') ? answerByKey['5bf2de35caf8ef7096105c23'].answer : '',
            number: '',
            files: []
          }
        });
      } catch (e) {
        console.log(JSON.stringify(requestItem));
        console.log('Ha ocurrido un error en migrateSalfa');
        console.log('error:', e);
      }
    }
  } catch (e) {
    console.log('Ha ocurrido un error en migrateSalfa');
    console.log('error:', e);
  }
  process.exit(1);
}

migrateSalfa();
