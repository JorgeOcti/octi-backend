"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bluebird = require("bluebird");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const path = require("path");
const form_model_1 = require("../../form/models/form.model");
const participant_model_1 = require("../../form/models/participant.model");
async function fixAccesories() {
    dotenv.config({
        path: path.join(__dirname, '../../../.env')
    });
    const MONGODB_URI = process.env.MONGODB_URI || '';
    mongoose.Promise = bluebird;
    await mongoose.connect(MONGODB_URI, { useMongoClient: true });
    mongoose.set('debug', true);
    const forms = await form_model_1.default.find({});
    for (const form of forms) {
        for (const section of form.sections) {
            for (const question of section.questions) {
                if (question.accessories) {
                    for (const item of question.accessories.items) {
                        if (!item.amount) {
                            item.amount = false;
                        }
                    }
                }
            }
        }
        await form.save();
    }
    const participants = await participant_model_1.default.find({}, {
        'sections.answers.accessories': true,
        'sections.answers.accesoriesAnswered': true,
        'sections.answers.accesoriesSelected': true
    });
    for (const participant of participants) {
        for (const section of participant.sections) {
            for (const answer of section.answers) {
                if (answer.accessories) {
                    for (const item of answer.accessories.items) {
                        item.amount = false;
                    }
                }
                if (answer.accesoriesSelected && answer.accesoriesSelected.length) {
                    for (const accesorySelected of answer.accesoriesSelected) {
                        if (!answer.accesoriesAnswered.length) {
                            answer.accesoriesAnswered.push({
                                item: accesorySelected,
                                amount: 1
                            });
                        }
                    }
                }
            }
        }
        await participant.save();
    }
    process.exit(1);
}
fixAccesories();
//# sourceMappingURL=fixAccesories.js.map