import * as bluebird from 'bluebird';
import * as dotenv from 'dotenv';
import * as mongoose from 'mongoose';
import * as path from 'path';
import {ChoicesStatusCarInventory} from '../models/inventoryCar.model';
import InventoryLabel from '../models/inventoryLabel.model';

async function addlabel() {

  dotenv.config({
    path: path.join(__dirname, '../../../.env')
  });
  const MONGODB_URI: string = process.env.MONGODB_URI || '';
  (mongoose as any).Promise = bluebird;
  await mongoose.connect(MONGODB_URI, {});
  mongoose.set('debug', false);
  try {
    const inventoryLabel = new InventoryLabel({
      team: '5c06bd161f616ce4540bbb9e',
      name: 'Pasar a encontrado',
      affected: [ChoicesStatusCarInventory.reported, ChoicesStatusCarInventory.leftover],
      sendTo: ChoicesStatusCarInventory.found,
      updatedBy: '5af487b4f6a4c95ccd991466'
    });
    inventoryLabel.validate((err) => {
      if (err) {
        console.log(err);
      }
    });
    await inventoryLabel.save();
  } catch (e) {
    console.log('e', e);
  }
  process.exit(1);
}

addlabel();
