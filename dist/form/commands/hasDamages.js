"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bluebird = require("bluebird");
const dotenv = require("dotenv");
const participant_model_1 = require("../models/participant.model");
const mongoose = require("mongoose");
const path = require("path");
async function updateVin2() {
    dotenv.config({
        path: path.join(__dirname, '../../../.env')
    });
    const MONGODB_URI = process.env.MONGODB_URI || '';
    mongoose.Promise = bluebird;
    mongoose.set('debug', true);
    await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    const cursor = await participant_model_1.default.find({}).batchSize(10).cursor();
    cursor.on('data', async (participant) => {
        console.log(participant._id);
        try {
            let hasDamages = false;
            for (const section of participant.sections) {
                for (const answer of section.answers) {
                    // console.log(answer.damagesSelected);
                    if (!hasDamages && answer.damagesSelected.length) {
                        hasDamages = true;
                    }
                }
            }
            console.log(hasDamages);
            await participant_model_1.default.update({ _id: participant._id }, { $set: { hasDamages } });
        }
        catch (error) {
            console.log("error");
        }
        // participant.hasDamages = hasDamages;
        // try {
        //   const hasDamages = participant.sections.some((section: any) => {
        //     return section.answers.some((answer: any) => {
        //       return answer.damagesSelected.length > 0;
        //     });
        //   });
        //   console.log(participant.hasDamages);
        //   await Participant.update({_id: participant}, {$set: {hasDamages}});
        // } catch (error) {
        //   console.log(error);
        // }
    });
    cursor.on('end', async () => {
        setTimeout(() => process.exit(1), 60000);
    });
}
updateVin2();
//# sourceMappingURL=hasDamages.js.map