import * as bluebird from 'bluebird';
import * as dotenv from 'dotenv';
import * as mongoose from 'mongoose';
import * as path from 'path';
import Request from '../../request/models/request.model';
import RequestItem from '../../request/models/requestItem.model';

async function migrateSalfa() {
  dotenv.config({
    path: path.join(__dirname, '../../../.env')
  });
  const MONGODB_URI: string = process.env.MONGODB_URI || '';
  (mongoose as any).Promise = bluebird;
  await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  mongoose.set('debug', true);
  try {
    const requests = await Request.find({}, { createdBy: true }).populate([{
      path: 'createdBy',
      select: ['company']
    }]);
    for (const request of requests) {
      const company = request.createdBy?.company;
      if (company) {
        await Request.updateOne({ _id: request._id }, { company: request.createdBy.company });
        await RequestItem.updateMany({ request: request._id }, { company: request.createdBy.company });
      } else {
        console.log(request);
      }
    }
  } catch (e) {
    console.log('Ha ocurrido un error en migrateSalfa');
    console.log('error:', e);
  }
  await process.exit(1);
}

migrateSalfa();
