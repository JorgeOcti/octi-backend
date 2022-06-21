import * as bluebird from 'bluebird';
import * as dotenv from 'dotenv';
import * as mongoose from 'mongoose';
import * as path from 'path';
import RequestItem from '../../models/requestItem.model';
import Request from '../../models/request.model';

async function migrateRequestItemOrder() {
  dotenv.config({
    path: path.join(__dirname, '../../../.env')
  });
  const MONGODB_URI: string = process.env.MONGODB_URI || '';
  (mongoose as any).Promise = bluebird;
  await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  mongoose.set('debug', true);
  try {
    // const requests = await Request.find({ team: '5bf2de35caf8ef7096105cdd' }, { _id: true, number: true });
    // for (const request of requests) {
    const requestItems = await RequestItem.find({ team: '5bf2de35caf8ef7096105cdd', 'answers.questionId': '6154722a94bba10012230aae' }, {_id: true, request: true});
    await Request.updateMany({ _id: { $in: requestItems.map(item => item.request) } }, { $set: { conectaID: '' } });
      // for (const items of [requestItems]) {
      /*  if(item.answers.questionId)
        order++;
        await RequestItem.updateMany({ _id: items._id }, {
          $set: {
            order,
            code: `${request.number}-${order}`
          }
        });*/
      // }
    // }
  } catch (e) {
    console.log('Ha ocurrido un error en migrateRequestItemOrder');
    console.log('error:', e);
  }
  await process.exit(1);
}

migrateRequestItemOrder();
