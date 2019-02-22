"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bluebird = require("bluebird");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const path = require("path");
const inventoryCar_model_1 = require("../models/inventoryCar.model");
const inventoryLabel_model_1 = require("../models/inventoryLabel.model");
async function addlabel() {
    dotenv.config({
        path: path.join(__dirname, '../../../.env')
    });
    const MONGODB_URI = process.env.MONGODB_URI || '';
    mongoose.Promise = bluebird;
    await mongoose.connect(MONGODB_URI, {
        useMongoClient: true
    });
    mongoose.set('debug', false);
    try {
        const inventoryLabel = new inventoryLabel_model_1.default({
            team: '5c06bd161f616ce4540bbb9e',
            name: 'Pasar a encontrado',
            affected: [inventoryCar_model_1.ChoicesStatusCarInventory.reported, inventoryCar_model_1.ChoicesStatusCarInventory.leftover],
            sendTo: inventoryCar_model_1.ChoicesStatusCarInventory.found,
            updatedBy: '5af487b4f6a4c95ccd991466'
        });
        inventoryLabel.validate((err) => {
            if (err) {
                console.log(err);
            }
        });
        await inventoryLabel.save();
    }
    catch (e) {
        console.log('e', e);
    }
    process.exit(1);
}
addlabel();
//# sourceMappingURL=addLabel.js.map