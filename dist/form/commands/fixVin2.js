"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const car_model_1 = require("../../app/models/car.model");
const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");
async function updateVin2() {
    dotenv.config({
        path: path.join(__dirname, '../../../.env')
    });
    const MONGODB_URI = process.env.MONGODB_URI || '';
    await mongoose.connect(MONGODB_URI, { useMongoClient: true });
    const cars = await car_model_1.default.find({});
    cars.forEach(function (x) {
        const vin2 = x.vin.substr(x.vin.length - 6);
        console.log(vin2);
        x.vin2 = vin2.toString();
        x.save();
    });
    process.exit(1);
}
updateVin2();
//# sourceMappingURL=fixVin2.js.map