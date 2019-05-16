"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bluebird = require("bluebird");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const path = require("path");
const participant_model_1 = require("../../form/models/participant.model");
const team_model_1 = require("../models/team.model");
async function fixAccesories() {
    dotenv.config({
        path: path.join(__dirname, '../../../.env')
    });
    const MONGODB_URI = process.env.MONGODB_URI || '';
    mongoose.Promise = bluebird;
    await mongoose.connect(MONGODB_URI, { useMongoClient: true });
    mongoose.set('debug', true);
    const teams = await team_model_1.default.find({});
    for (const team of teams) {
        const participants = await participant_model_1.default.find({ team }).sort({ createdAt: 1 });
        for (const participant of participants) {
            const updateTeam = await team_model_1.default.findOneAndUpdate({ _id: team._id }, { $inc: { formsNumber: 1 } }, { new: true });
            if (updateTeam) {
                console.log(updateTeam.formsNumber);
                participant.number = updateTeam.formsNumber;
            }
            await participant.save();
        }
    }
    process.exit(1);
}
fixAccesories();
//# sourceMappingURL=fixFormNumber.js.map