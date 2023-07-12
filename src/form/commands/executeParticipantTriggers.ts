import * as dotenv from "dotenv";
import path from "path";
import mongoose from "mongoose";
import * as bluebird from "bluebird";
import Participant from "../models/participant.model";
import TriggerHandler from "../controllers/triggers/triggerHandler";
import Form from "../models/form.model";


async function executeParticipantTriggers(){
  dotenv.config({
    path: path.join(__dirname, '../../../.env')
  });
  const MONGODB_URI: string = process.env.MONGODB_URI || '';
  (mongoose as any).Promise = bluebird;
  await mongoose.connect(MONGODB_URI, {  });
  mongoose.set('strictQuery', true);
  mongoose.set('debug', true);

  const participants = await Participant.aggregate([
    {
      $match: {
        createdAt: {
          $gte: new Date('2023-07-10T19:00:00.000Z'),
          $lte: new Date('2023-07-12T13:59:59.999Z')
        }
      },
    },
    {
      $lookup: {
        from: "forms",
        localField: "form",
        foreignField: "_id",
        as: "form_data"
      }
    }, {
      $unwind: {
        path: "$form_data"
      }
    },
    {
      $match: {
        "form_data.triggers": { $exists: true, $ne: [] }
      }
    }
  ]).exec();


  for (let participant of participants) {
    const form = await Form.findById(participants[0].form).exec();
    if (form && form.triggers && form.triggers.length) {
      let triggersHandler = new TriggerHandler(form, participant);
      await triggersHandler.execute({});
    }
  }
}

executeParticipantTriggers();
