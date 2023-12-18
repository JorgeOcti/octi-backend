import * as bluebird from 'bluebird';
import * as dotenv from 'dotenv';
import * as mongoose from 'mongoose';
import * as path from 'path';
// import BillingTeamQueue from '../../billing/tasks/billingTeam.task';
import BillingTeamProcessor from '../../billing/tasks/billingTeamProcessor.task';
import BillingTeamPDF from '../../billing/tasks/billingTeamPDF.task';
import Company from '../models/company.model';
import Team from '../models/team.model';

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
    await new BillingTeamProcessor().processBilling({}, true);
  } catch (e) {
    console.log('Ha ocurrido un error en BillingTeamProcessor');
    console.log('error:', e);
  }

  try {
    console.log('Iniciando post procesamiento de PDF');
    await new BillingTeamPDF().processPDFInvoices();
  } catch (e) {
    console.log('Ha ocurrido un error en BillingTeamPDF');
    console.log('error:', e);
  }

  process.exit(1);
}

BillingTeamRun();
