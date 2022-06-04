import * as bluebird from 'bluebird';
import * as dotenv from 'dotenv';
import * as mongoose from 'mongoose';
import * as path from 'path';
import InventoryCar, { ChoicesStatusCarInventory } from '../../../inventory/models/inventoryCar.model';
import carTracker from '../../controllers/tracker/car.tracker';
import Inventory, { ChoicesStatusInventory } from '../../../inventory/models/inventory.model';
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
    // 5bf2de34caf8ef7096105cda = Derco
    // 5bf2de35caf8ef7096105cdd = Salfa
    // const teams = ['5bf2de34caf8ef7096105cda'];
    const teams: string[] = [];

    const formsDeliveryCostumer = ['6058f9e53039dbadeeb7a559', '5fb6a0da49698b82eb9454e1'];

    let extraFilter: any = {};
    if(teams.length){
      extraFilter['team'] = { $in: teams };
    }
    await Form.updateMany({
      ...extraFilter,
      _id: { $in: formsDeliveryCostumer },
    }, { $set: { deliveryToCustomer: true } });
    await Form.updateMany({
      ...extraFilter,
      _id: { $nin: formsDeliveryCostumer },
    }, { $set: { deliveryToCustomer: false } });
    await Participant.updateMany({
      ...extraFilter,
      form: { $in: formsDeliveryCostumer }
    }, { $set: { deliveryToCustomer: true } });
    await Participant.updateMany({
      ...extraFilter,
      form: { $nin: formsDeliveryCostumer }
    }, { $set: { deliveryToCustomer: false } });

    const receptionForms = await Form.find({
      ...extraFilter,
      reception: true
    }, { _id: true });
    await Participant.updateMany({
      ...extraFilter,
      form: { $in: receptionForms.map((form) => (form._id)) }
    }, { $set: { reception: true } });

    const shippingForms = await Form.find({
      ...extraFilter,
      shipping: true
    }, { _id: true });
    await Participant.updateMany({
      form: { $in: shippingForms.map((form) => (form._id)) }
    }, { $set: { shipping: true } });

    const inventories = await Inventory
      .find({
        ...extraFilter,
        status: {
          $in: [ChoicesStatusInventory.finalized]
        }
      }, { _id: true });
    const inventoryCarcursor = await InventoryCar
      .find({
        inventory: {
          $in: inventories.map((inventory) => (inventory._id))
        },
        status: [
          ChoicesStatusCarInventory.found,
          ChoicesStatusCarInventory.pending,
          ChoicesStatusCarInventory.leftover,
          ChoicesStatusCarInventory.reported
        ]
      }, { _id: true })
      .batchSize(20)
      .cursor();
    inventoryCarcursor.on('data', async (inventoryCar) => {
      try {
        await carTracker.fromInventoryCar({ id: inventoryCar._id });
      } catch (e) {
        console.log('error:', e);
      }
    });
    inventoryCarcursor.on('end', async () => {
      const participantCursor = await Participant
        .find({
          ...extraFilter
        }, { _id: true })
        .batchSize(20)
        .cursor();
      participantCursor.on('data', async (participant) => {
        try {
          await carTracker.fromParticipant({ id: participant._id });
        } catch (e) {
          console.log('error:', e);
        }
      });
      participantCursor.on('end', async () => {
        process.exit(1);
      });
    });
  } catch (e) {
    console.log('Ha ocurrido un error en migrateTracker');
    console.log('error:', e);
  }
}

migrateTracker!();
