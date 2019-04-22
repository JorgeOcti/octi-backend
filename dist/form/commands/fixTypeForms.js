"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bluebird = require("bluebird");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const path = require("path");
const form_model_1 = require("../models/form.model");
async function createDamage() {
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
                console.log('--------------------------');
                console.log(question.accessories);
                if (question.accessories) {
                    question.kind = form_model_1.KindQuestion.accessory;
                }
                else if (question.damages) {
                    question.kind = form_model_1.KindQuestion.damage;
                }
                else if (question.scale) {
                    question.kind = form_model_1.KindQuestion.scale;
                }
                else {
                    console.log('ERROR');
                }
            }
        }
        await form.save();
    }
    process.exit(1);
}
createDamage();
//# sourceMappingURL=fixTypeForms.js.map