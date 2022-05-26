import * as bluebird from 'bluebird';
import * as dotenv from 'dotenv';
import * as mongoose from 'mongoose';
import * as path from 'path';
import InventoryCar from '../../inventory/models/inventoryCar.model';
import carTracker from '../controllers/tracker/car.tracker';
import Inventory from '../../inventory/models/inventory.model';
import Participant from '../../form/models/participant.model';
// import Form from '../../form/models/form.model';

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
    // const formsDeliveryCostumer = ['6058f9e53039dbadeeb7a559', '5fb6a0da49698b82eb9454e1'];
    // await Form.updateMany({ _id: { $in: formsDeliveryCostumer } }, { $set: { deliveryToCustomer: true } });
    // await Form.updateMany({ _id: { $nin: formsDeliveryCostumer } }, { $set: { deliveryToCustomer: false } });
    // await Participant.updateMany({ form: { $in: formsDeliveryCostumer } }, { $set: { deliveryToCustomer: true } });
    // await Participant.updateMany({ form: { $nin: formsDeliveryCostumer } }, { $set: { deliveryToCustomer: false } });

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
    let complete = false;
    const finishProcess = () =>{
       if(complete){
        process.exit(1);
      } else{
        complete = true
      }
    };
    inventoryCarcursor.on('end', async () => {
     finishProcess();
    });
    participantCursor.on('end', async () => {
      finishProcess();
    });
  } catch (e) {
    console.log('Ha ocurrido un error en migrateTracker');
    console.log('error:', e);
  }

}

migrateTracker();
