"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bluebird = require("bluebird");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const path = require("path");
const car_model_1 = require("../models/car.model");
const inventoryCar_model_1 = require("../../inventory/models/inventoryCar.model");
const requestItem_model_1 = require("../../request/models/requestItem.model");
const participant_model_1 = require("../../form/models/participant.model");
const stockCar_model_1 = require("../../inventory/models/stockCar.model");
const planning_model_1 = require("../../planning/models/planning.model");
const team_model_1 = require("../models/team.model");
// import ActivityHistory, { ChoicesTypeActivity } from '../models/activityHistory.model';
async function fixDuplicatesCar() {
    try {
        dotenv.config({
            path: path.join(__dirname, '../../../.env')
        });
        const MONGODB_URI = process.env.MONGODB_URI || '';
        mongoose.Promise = bluebird;
        await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
        mongoose.set('debug', true);
        // const team = mongoose.Types.ObjectId("5bf2de34caf8ef7096105cda");
        const teams = await team_model_1.default.find({});
        for (const team of teams) {
            const cars = await car_model_1.default.aggregate([{
                    $match: {
                        team: team._id
                    }
                }, {
                    $group: {
                        _id: "$vin",
                        count: { $sum: 1 }
                    }
                }, {
                    $match: {
                        count: { $ne: 1 }
                    }
                }]);
            if (cars) {
                for (const car of cars) {
                    if (car._id && car._id.length) {
                        const carsByVIN = await car_model_1.default.find({ vin: car._id, team: team._id }, { sort: '-created_at' });
                        let firstCar = undefined;
                        for (const carByVIN of carsByVIN) {
                            console.log('carByVIN', carByVIN);
                            if (firstCar === undefined) {
                                firstCar = carByVIN;
                            }
                            else {
                                await inventoryCar_model_1.default.update({ car: carByVIN._id }, { $set: { car: firstCar._id } });
                                await requestItem_model_1.default.update({ car: carByVIN._id }, { $set: { car: firstCar._id } });
                                await participant_model_1.default.update({ car: carByVIN._id }, { $set: { car: firstCar._id } });
                                await stockCar_model_1.default.update({ car: carByVIN._id }, { $set: { car: firstCar._id } });
                                await planning_model_1.default.update({ car: carByVIN._id }, { $set: { car: firstCar._id } });
                                await car_model_1.default.findByIdAndDelete(carByVIN._id);
                            }
                        }
                    }
                }
            }
        }
    }
    catch (e) {
        console.log(e);
        process.exit(1);
    }
    process.exit(1);
}
fixDuplicatesCar();
//# sourceMappingURL=fixDuplicates.js.map