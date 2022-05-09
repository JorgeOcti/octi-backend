import * as bluebird from 'bluebird';
import * as dotenv from 'dotenv';
import * as mongoose from 'mongoose';
import * as path from 'path';
import Milestone, {ChoicesKindMilestone, ChoicesStepMilestone} from "../models/milestone.model";
import Team from "../../app/models/team.model";
import Form from "../../form/models/form.model";

// import ActivityHistory, { ChoicesTypeActivity } from '../models/activityHistory.model';

async function createBaseMilestone() {
  try {
    dotenv.config({
      path: path.join(__dirname, '../../../.env')
    });
    const MONGODB_URI: string = process.env.MONGODB_URI || '';
    (mongoose as any).Promise = bluebird;
    await mongoose.connect(MONGODB_URI, {useNewUrlParser: true, useUnifiedTopology: true});
    mongoose.set('debug', true);
    const teams = await Team.find({});
    for (const team of teams) {
      const milestones = await Milestone.find({team: team._id});
      const receptionForm = await Form.findOne({team: team._id, reception: true});
      if (milestones.length === 0 && receptionForm) {
        await Milestone.insertMany([{
          team: team._id,
          name: 'Checkear carga',
          kind: ChoicesKindMilestone.form,
          form: receptionForm,
          step: ChoicesStepMilestone.checkItem,
          order: 1
        }, {
          team: team._id,
          name: 'Evidencia de carga',
          kind: ChoicesKindMilestone.file,
          step: ChoicesStepMilestone.loadEvidence,
          order: 2
        }, {
          team: team._id,
          name: 'Subir Documentos',
          kind: ChoicesKindMilestone.form,
          form: receptionForm,
          step: ChoicesStepMilestone.finishTransmittal,
          order: 3
        }])
      }
    }
  } catch (e) {
    console.log(e);
    process.exit(1);
  }
  process.exit(1);
}

createBaseMilestone();
