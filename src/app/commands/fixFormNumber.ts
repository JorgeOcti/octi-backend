import * as bluebird from 'bluebird';
import * as dotenv from 'dotenv';
import * as mongoose from 'mongoose';
import * as path from 'path';
import Participant from '../../form/models/participant.model';
import Team from '../models/team.model';

async function fixAccesories() {
  dotenv.config({
    path: path.join(__dirname, '../../../.env')
  });
  const MONGODB_URI: string = process.env.MONGODB_URI || '';
  (mongoose as any).Promise = bluebird;
  await mongoose.connect(MONGODB_URI, {useMongoClient: true});
  mongoose.set('debug', true);
  const teams = await Team.find({});
  for (const team  of teams) {
    const participants = await Participant.find({team}).sort({createdAt: 1});
    for (const participant  of participants) {
      const updateTeam = await Team.findOneAndUpdate({_id: team._id}, {$inc: {formsNumber: 1}}, {new: true});
      if (updateTeam) {
        console.log(updateTeam.formsNumber);
        participant.number = updateTeam.formsNumber;
      }
      await participant.save();
    }
  }
  process.exit(1);
}

fixAccesories();
