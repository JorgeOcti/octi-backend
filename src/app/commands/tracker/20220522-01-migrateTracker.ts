import * as bluebird from 'bluebird';
import * as dotenv from 'dotenv';
import * as mongoose from 'mongoose';
import * as path from 'path';
import InventoryCar, { ChoicesStatusCarInventory } from '../../../inventory/models/inventoryCar.model';
import carTracker from '../../controllers/tracker/car.tracker';
import Inventory from '../../../inventory/models/inventory.model';
import Participant from '../../../form/models/participant.model';
import Form from '../../../form/models/form.model';

async function migrateTracker() {
  dotenv.config({
    path: path.join(__dirname, '../../../.env')
  });
  const MONGODB_URI: string = process.env.MONGODB_URI || '';
  (mongoose as any).Promise = bluebird;
  await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  mongoose.set('debug', false);
  try {
    new Inventory({});
    // 5bf2de34caf8ef7096105cda = Derco
    const teams = ['5bf2de34caf8ef7096105cda'];
    const formsDeliveryCostumer = ['6058f9e53039dbadeeb7a559', '5fb6a0da49698b82eb9454e1'];
    await Form.updateMany({
      _id: { $in: formsDeliveryCostumer }
    }, { $set: { deliveryToCustomer: true } });
    await Form.updateMany({
      _id: { $nin: formsDeliveryCostumer },
      team: { $in: teams }
    }, { $set: { deliveryToCustomer: false } });
    await Participant.updateMany({
      team: { $in: teams },
      form: { $in: formsDeliveryCostumer }
    }, { $set: { deliveryToCustomer: true } });
    await Participant.updateMany({
      team: { $in: teams },
      form: { $nin: formsDeliveryCostumer }
    }, { $set: { deliveryToCustomer: false } });

    const receptionForms = await Form.find({
      team: { $in: teams },
      reception: true
    }, { _id: true });
    await Participant.updateMany({
      team: { $in: teams },
      form: { $in: receptionForms.map((form) => (form._id)) }
    }, { $set: { reception: true } });

    const shippingForms = await Form.find({
      team: { $in: teams },
      shipping: true
    }, { _id: true });
    await Participant.updateMany({
      form: { $in: shippingForms.map((form) => (form._id)) }
    }, { $set: { shipping: true } });

    const inventoryCarcursor = await InventoryCar
      .find({
        status: [
          ChoicesStatusCarInventory.found,
          ChoicesStatusCarInventory.reported
        ]
      }, { _id: true })
      .batchSize(100)
      .cursor();
    inventoryCarcursor.on('data', async (inventoryCar) => {
      try {
        await carTracker.fromInventoryCar({ id: inventoryCar._id });
      } catch (e) {
        console.log('error:', e);
      }
    });
    inventoryCarcursor.on('end', async () => {
      // const participantCursor = await Participant
      //   .find({
      //     team: { $in: teams }
      //   }, { _id: true })
      //   .batchSize(100)
      //   .cursor();
      // participantCursor.on('data', async (participant) => {
      //   try {
      //     await carTracker.fromParticipant({ id: participant._id });
      //   } catch (e) {
      //     console.log('error:', e);
      //   }
      // });
      // participantCursor.on('end', async () => {
      //   process.exit(1);
      // });
      process.exit(1);
    });
  } catch (e) {
    console.log('Ha ocurrido un error en migrateTracker');
    console.log('error:', e);
  }
}

migrateTracker();
