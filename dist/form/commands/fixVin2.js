"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bluebird = require("bluebird");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const path = require("path");
const car_model_1 = require("../../app/models/car.model");
async function updateVin2() {
    dotenv.config({
        path: path.join(__dirname, '../../../.env')
    });
    const MONGODB_URI = process.env.MONGODB_URI || '';
    mongoose.Promise = bluebird;
    await mongoose.connect(MONGODB_URI, { useMongoClient: true });
    const cars = await car_model_1.default.find({});
    for (const car of cars) {
        const vin2 = car.vin.substr(car.vin.length - 6);
        console.log(vin2);
        car.vin2 = vin2.toString();
        car.save();
    }
    process.exit(1);
}
updateVin2();
//# sourceMappingURL=fixVin2.js.map