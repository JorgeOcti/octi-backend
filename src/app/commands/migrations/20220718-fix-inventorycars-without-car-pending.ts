import * as bluebird from 'bluebird';
import * as dotenv from 'dotenv';
import * as mongoose from 'mongoose';
import * as path from 'path';
// import Car from '../../models/car.model';
import InventoryCar from '../../../inventory/models/inventoryCar.model';
// import RequestItem from '../../../request/models/requestItem.model';
// import Participant from '../../../form/models/participant.model';
// import StockCar from '../../../inventory/models/stockCar.model';
// import Planning from '../../../planning/models/planning.model';
// import TransmittalItem from '../../../distribution/models/transmittalItem.model';
// import Team from '../../models/team.model';

// import ActivityHistory, { ChoicesTypeActivity } from '../models/activityHistory.model';

async function fixInventoryCars() {
  try {
    dotenv.config({
      path: path.join(__dirname, '../../../.env')
    });
    const MONGODB_URI: string = process.env.MONGODB_URI || '';
    (mongoose as any).Promise = bluebird;
    await mongoose.connect(MONGODB_URI);
    mongoose.set('debug', false);
    // const team = mongoose.Types.ObjectId("5bf2de34caf8ef7096105cda");
    const toDelete = await InventoryCar.aggregate([
      {
        $match:
          {
            status: 'pending'
          }
      }, {
        $lookup: {
          from: 'cars',
          localField: 'car',
          foreignField: '_id',
          as: 'car'
        }
      }, {
        $unwind: {
          path: '$car',
          preserveNullAndEmptyArrays: true
        }
      }, {
        $match: {
          'car._id': {
            $exists: false
          }
        }
      }/*, {
        $group: {
          _id: {
            status: '$status'
          },
          count: {
            $sum: 1
          }
        }
      }*/ ,{
        $project: {
          _id: true
        }
      }
    ]);
    const toDeleteIDs= toDelete.map((item)=>(item._id));
    console.log(toDeleteIDs);
    mongoose.set('debug', true);
    await InventoryCar.deleteMany({_id: { $in: toDeleteIDs }});
  } catch (e) {
    console.log(e);
    process.exit(1);
  }
}

fixInventoryCars();
