/*import { ModuleHistory } from '../../../app/models/history.types';*/
import * as bluebird from 'bluebird';
import * as dotenv from 'dotenv';
import * as mongoose from 'mongoose';
import * as path from 'path';
/*import Module from '../../../billing/models/module.model';
import Submodule from '../../../billing/models/submodule.model';*/
import BillingTeamQueue from '../../billing/tasks/billingTeam.task';
import Company from '../models/company.model';
import Team from '../models/team.model';

// node dist/app/commands/migrations/BillingTeamRun.js

async function BillingTeamRun() {
  dotenv.config({
    path: path.join(__dirname, '../../../.env')
  });
  const MONGODB_URI: string = process.env.MONGODB_URI || '';
  (mongoose as any).Promise = bluebird;
  await mongoose.connect(MONGODB_URI);
  mongoose.set('debug', true);
  new Team()
  new Company()
  try {
    await new BillingTeamQueue().processBilling({}, true);
    process.exit(1);
  } catch (e) {
    console.log('Ha ocurrido un error en BillingTeamRun');
    console.log('error:', e);
  }
  // process.exit(1);
}

BillingTeamRun();
