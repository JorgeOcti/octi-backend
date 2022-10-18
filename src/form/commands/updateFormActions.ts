import * as bluebird from 'bluebird';
import * as dotenv from 'dotenv';
import Form, { KindActionForm } from '../models/form.model';
import * as mongoose from 'mongoose';
import * as path from 'path';

async function updateFormActions() {
  dotenv.config({
    path: path.join(__dirname, '../../../.env')
  });
  const MONGODB_URI: string = process.env.MONGODB_URI || '';
  (mongoose as any).Promise = bluebird;
  await mongoose.connect(MONGODB_URI, { useMongoClient: true });
  mongoose.set('debug', true);
  await Form.updateMany({ deliveryToCustomer: true }, { $set: { action: KindActionForm.delivery } });
  await Form.updateMany({ shipping: true }, { $set: { action: KindActionForm.shipping } });
  await Form.updateMany({ reception: true }, { $set: { action: KindActionForm.reception } });
  process.exit(1);
}

updateFormActions();
