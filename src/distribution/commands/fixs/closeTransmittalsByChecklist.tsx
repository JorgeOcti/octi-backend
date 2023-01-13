import * as mongoose from 'mongoose';
import * as dotenv from "dotenv";
import * as path from 'path';
import * as bluebird from "bluebird";
import TransmittalItem from "../../models/transmittalItem.model";
import {ITransmittalItem} from "../../interfaces";
import Transmittal from "../../models/transmittal.model";
import {ChoicesStatusTransmittal} from "../../models/transmitall.types";
import logger from "../../../services/logger.service";
import * as moment from "moment-timezone";
import {IParticipant} from "../../../form/interfaces";

interface IGroupTransmittalItems {
  _id: string;
  items: (ITransmittalItem | any)[];
}

function groupResultsByOT(datum: ({OT: string} | any)[]): IGroupTransmittalItems[] {
  let data : any = {};
  let results : IGroupTransmittalItems[] = [];

  for (let tmp of datum){
    if (!data[tmp.OT]){
      data[tmp.OT] = [];
    }
    data[tmp.OT].push({_id: tmp._id, participants: tmp.participants});
  }

  for (let key of Object.getOwnPropertyNames(data)) {
    results.push({_id: key, items: data[key]})
  }

  return results;
}

async function closeTransmittalsByChecklist(){
  try {
    dotenv.config({
      path: path.join(__dirname, '../../../.env')
    });
    const MONGODB_URI: string = process.env.MONGODB_URI || '';
    (mongoose as any).Promise = bluebird;
    await mongoose.connect(MONGODB_URI);
    mongoose.set('debug', true);

    let transmittalItems : (ITransmittalItem | any)[] = await TransmittalItem.aggregate([
      {$lookup: {
          from: 'cars',
          localField: 'car',
          foreignField: '_id',
          as: 'car_data',
        }}, {$unwind: {
          path: "$car_data",
          includeArrayIndex: "0",
          preserveNullAndEmptyArrays: true
        }}, {$lookup: {
          from: 'transmittals',
          localField: 'transmittal',
          foreignField: '_id',
          as: 'transmittal_data'
        }}, {$unwind: {
          path: "$transmittal_data",
          includeArrayIndex: "0",
          preserveNullAndEmptyArrays: true
        }}, {
        $match: {
          "transmittal_data.status": {$nin: ['completed', 'completed_by_reception']},
          "transmittal_data.type": new mongoose.Types.ObjectId('617a1a7df2e24a001193fdd8') // Internacional IMCRUZ
        }}, {
        $addFields: { OT: { $toString:'$transmittal_data.number'} }
      }, {
        $lookup: {
          from: 'participants',
          let: {car_id: '$car', created: '$createdAt'},
          as: 'participants',
          pipeline: [{$match:
              { $expr:
                  { $and:
                      [
                        { $eq: [ "$car",  "$$car_id" ] },
                        { $eq: [ "$name",  'RECEPCIÓN' ] },
                        { $gt: [ "$createdAt", "$$created"  ] },
                      ]
                  }
              }
          }, {
            $project: {createdAt: 1}
          }]
        }},
      {$project: {
          OT: 1,
          _id: 1,
          participants: 1,
        }

      }
    ]).exec();


    let groupedResults = groupResultsByOT(transmittalItems);

    for (let groupedResult  of groupedResults) {
      let shouldClose = true;
      for (let transmittalItem of groupedResult.items) {
        let isChecked = transmittalItem.participants.length > 0;
        shouldClose = shouldClose && isChecked;
        if (isChecked) {
          logger.debug(`CloseTransmittalCommand: closing transmittal item: ${JSON.stringify(transmittalItem._id)}`);
          let date = moment.min(transmittalItem.participants.map((participant: IParticipant) => moment(participant.createdAt)));
          await TransmittalItem.updateOne({_id: new mongoose.Types.ObjectId(transmittalItem._id)}, {
            $set: {arrivalDate: date}
          });
        }
      }

      if (shouldClose){
        logger.debug(`CloseTransmittalCommand: closing transmittal: ${JSON.stringify(groupedResult._id)}`);
        await Transmittal.updateOne({number: groupedResult._id}, {
          $set: { status:  ChoicesStatusTransmittal.completed_by_reception}
        });
      }
    }


  } catch (error) {
    console.log(error);
    process.exit(1);
  }
  process.exit(0);
}

closeTransmittalsByChecklist();
