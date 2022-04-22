import * as bluebird from 'bluebird';
import * as dotenv from 'dotenv';
import * as mongoose from 'mongoose';
import * as path from 'path';
import Team from '../../app/models/team.model';
import RequestItem from '../../request/models/requestItem.model';
import Request from '../../request/models/request.model';
// import PaymentMethods from '../models/paymentMethod.model';
import TeamSetting from '../../app/models/teamSetting.model';

async function migrateSalfa() {
  dotenv.config({
    path: path.join(__dirname, '../../../.env')
  });
  const MONGODB_URI: string = process.env.MONGODB_URI || '';
  (mongoose as any).Promise = bluebird;
  await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  mongoose.set('debug', true);
  try {
    const teams = await Team.find({});
    for (const team of teams) {
      const isSalfa = team._id.toString() === '5bf2de35caf8ef7096105cdd';
      await TeamSetting.findOneAndUpdate({ team }, {
        request: {
          brand: true,
          brandReadOnly: isSalfa,
          denominationReadOnly: isSalfa,
          colorReadOnly: isSalfa,
          materialReadOnly: isSalfa,
          ticket: isSalfa,
          conectaID: isSalfa,
          reason: !isSalfa,
          priority: !isSalfa,
          internalNumber: !isSalfa,
          entry: !isSalfa,
          sellerText: isSalfa,
          secondColorOption: isSalfa,
          thirdColorOption: isSalfa,
        },
      });
    }

    const team = await Team.findById('5bf2de35caf8ef7096105cdd');
    const requestItems = await RequestItem.find({ team, answers: {$exists: true} }).populate([{
      path: 'request'
    }]);
    // const paymentMethods = await PaymentMethods.find({ team });
    // const paymentMethodByKey = paymentMethods.reduce((acc: any, cur: any) => {
    //   return {
    //     ...acc,
    //     [cur.name]: cur._id
    //   };
    // }, {});
    for (const requestItem of requestItems) {
      try {
        // const paymentMethodText = answerByKey.hasOwnProperty('5bf2de35caf8ef7096105c23') ? answerByKey['5bf2de35caf8ef7096105c23'].answer.trim() : '';
        const answerByKey = requestItem.answers.reduce((acc: any, cur: any) => {
          if (cur?.questionId) {
            return {
              ...acc,
              [cur.questionId.toString()]: cur
            };
          }
          return {
            ...acc
          };
        }, {});
        if (!requestItem.request?.conectaID?.length && answerByKey.hasOwnProperty('6154722a94bba10012230aae')) {
          const conectaID = answerByKey['6154722a94bba10012230aae'].answer;
          await Request.findByIdAndUpdate(requestItem.request, {
            conectaID
          });
        }
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
  await process.exit(1);
}

migrateSalfa();
