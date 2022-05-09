import * as bluebird from 'bluebird';
import * as dotenv from 'dotenv';
import * as mongoose from 'mongoose';
import * as path from 'path';
import {IInventoryCar} from '../interfaces/inventory.interface';
import Inventory from '../models/inventory.model';
/*
* run fix
* node dist/inventory/commands/addedInventoryCar.js
* */
async function addedInventoryCar() {

  dotenv.config({
    path: path.join(__dirname, '../../../.env')
  });
  const MONGODB_URI: string = process.env.MONGODB_URI || '';
  (mongoose as any).Promise = bluebird;
  await mongoose.connect(MONGODB_URI, {
    useMongoClient: true
  });
  mongoose.set('debug', true);
  try {
    const inventories : [any] = (await Inventory.find({}).lean() as [any]);
    for (const inventory of inventories) {
      if (inventory.hasOwnProperty('cars')) {
        const inventoryCars = inventory.cars.map((car: IInventoryCar) => {
          car.inventory = inventory._id;
          return car;
        });
        await mongoose.connection.db.collection('inventorycars').insertMany(inventoryCars);
      }
    }
  } catch (e) {
    console.log('e', e);
  }
  process.exit(1);
}

addedInventoryCar();
