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
    await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    const cursor = await participant_model_1.default.find({}).batchSize(50).cursor();
    cursor.on('data', async (participant) => {
        console.log(participant.number);
        // let hasDamages = false;
        // for (const section  of participant.sections) {
        //   for (const answer  of section.answers) {
        //     console.log(answer.damagesSelected);
        //     if(!hasDamages && answer.damagesSelected.length){
        //       hasDamages = true;
        //     }
        //   }
        // }
        // participant.hasDamages = hasDamages;
        participant.hasDamages = participant.sections.some((section) => {
            return section.answers.some((answer) => {
                return answer.damagesSelected.length > 0;
            });
        });
        participant.save();
    });
    cursor.on('end', async () => {
        process.exit(1);
    });
}
updateVin2();
//# sourceMappingURL=hasDamages.js.map