"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bluebird = require("bluebird");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const path = require("path");
const inventory_model_1 = require("../models/inventory.model");
const inventoryCar_model_1 = require("../models/inventoryCar.model");
/*
* run fix
* node dist/inventory/commands/addedInventoryCar.js
* */
async function addedInventoryCar() {
    dotenv.config({
        path: path.join(__dirname, '../../../.env')
    });
    const MONGODB_URI = process.env.MONGODB_URI || '';
    mongoose.Promise = bluebird;
    await mongoose.connect(MONGODB_URI, {
        useMongoClient: true
    });
    mongoose.set('debug', true);
    try {
        const inventories = await inventory_model_1.default.find({}).lean();
        for (const inventory of inventories) {
            if (inventory.hasOwnProperty('cars')) {
                const inventoryCars = inventory.cars.map((car) => {
                    car.inventory = inventory._id;
                    return car;
                });
                await inventoryCar_model_1.default.insertMany(inventoryCars);
            }
        }
    }
    catch (e) {
        console.log('e', e);
    }
    process.exit(1);
}
addedInventoryCar();
//# sourceMappingURL=addedInventoryCar.js.map