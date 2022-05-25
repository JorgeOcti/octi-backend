import * as bluebird from 'bluebird';
import * as dotenv from 'dotenv';
import * as mongoose from 'mongoose';
import * as path from 'path';
import InventoryCar from '../../inventory/models/inventoryCar.model';
import carTracker from '../controllers/tracker/car.tracker';
import Inventory from '../../inventory/models/inventory.model';
import Participant from '../../form/models/participant.model';
import { Car } from '../models';
import History from '../models/history.model';
import Form from '../../form/models/form.model';

async function migrateTracker() {
  dotenv.config({
    path: path.join(__dirname, '../../../.env')
  });
  const MONGODB_URI: string = process.env.MONGODB_URI || '';
  (mongoose as any).Promise = bluebird;
  await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  mongoose.set('debug', true);
  try {
    new Inventory({});
    const formsDeliveryCustumer = ['6058f9e53039dbadeeb7a559', '5fb6a0da49698b82eb9454e1'];
    await Form.updateMany({ _id: { $in: formsDeliveryCustumer } }, { $set: { deliveryToCustomer: true } });
    await Form.updateMany({ _id: { $nin: formsDeliveryCustumer } }, { $set: { deliveryToCustomer: false } });
    await Participant.updateMany({ form: { $in: formsDeliveryCustumer } }, { $set: { deliveryToCustomer: true } });
    await Participant.updateMany({ form: { $nin: formsDeliveryCustumer } }, { $set: { deliveryToCustomer: false } });
    if(false){
      const cars = await Car.find({});
      for (const car of cars) {
        const lastHistory = await History.findOne({car: car._id}, {}, { sort: { 'executedAt': -1 } });
        if (lastHistory) {
          await History.updateMany({
            car: car._id,
            current: true
          }, {
            $set: { current: false }
          });
          await History.updateOne({
            _id: lastHistory?._id
          }, {
            $set: { current: false }
          });
        }
      }
      process.exit(1);
    }

    const inventoryCarcursor = await InventoryCar
      .find({}, { _id: true })
      .batchSize(20)
      .cursor();
    const participantCursor = await Participant
      .find({}, { _id: true })
      .batchSize(20)
      .cursor();
    inventoryCarcursor.on('data', async (inventoryCar) => {
      try {
        await carTracker.fromInventoryCar({ id: inventoryCar._id });
      } catch (e) {
        console.log('error:', e);
      }
    });
    participantCursor.on('data', async (participant) => {
      try {
        await carTracker.fromParticipant({ id: participant._id });
      } catch (e) {
        console.log('error:', e);
      }
    });
    inventoryCarcursor.on('end', async () => {
      process.exit(1);
    });
    participantCursor.on('end', async () => {
      process.exit(1);
    });
  } catch (e) {
    console.log('Ha ocurrido un error en migrateTracker');
    console.log('error:', e);
  }

}

migrateTracker();
