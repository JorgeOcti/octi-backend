"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bluebird = require("bluebird");
const dotenv = require("dotenv");
const moment = require("moment");
const mongoose = require("mongoose");
const path = require("path");
const random = require("random");
const car_model_1 = require("../../app/models/car.model");
const company_model_1 = require("../../app/models/company.model");
const team_model_1 = require("../../app/models/team.model");
const user_model_1 = require("../../app/models/user.model");
const venue_model_1 = require("../../app/models/venue.model");
const damages_model_1 = require("../models/damages.model");
const form_model_1 = require("../models/form.model");
const participant_model_1 = require("../models/participant.model");
function pickRandom(ary) {
    const index = Math.floor(random.float() * ary.length);
    return ary[index];
}
function generateRandomDamages(damage) {
    const p = random.float() * random.float() * random.float();
    const count = damage.parts.length;
    const partsTotal = Math.floor(p * count);
    const damages = [];
    for (let i = 0; i < partsTotal; i++) {
        const part = pickRandom(damage.parts);
        const kind = pickRandom(damage.kinds);
        const position = pickRandom(damage.positions);
        const newDamage = {
            part,
            kind,
            position
        };
        damages.push(newDamage);
    }
    return damages;
}
async function generateFormData() {
    dotenv.config({
        path: path.join(__dirname, '../../../.env')
    });
    const MONGODB_URI = process.env.MONGODB_URI || '';
    mongoose.Promise = bluebird;
    await mongoose.connect(MONGODB_URI, { useMongoClient: true });
    // form 5b0487db835536612bab1b61
    // section 5b0487db835536612bab1b65
    // question 5b0487db835536612bab1b66
    const team = await team_model_1.default.findOne({ name: 'Derco' });
    const company = await company_model_1.default.findOne({ name: 'Derco' });
    const user = await user_model_1.default.findOne({ email: 'richard@osacontrol.com' });
    const distributor = await venue_model_1.default.findById('5c3605307eb40314d3c46e75');
    const receivers = await venue_model_1.default.find({ team, type: 'receiver' });
    const reception = await form_model_1.default.findOne({ name: 'RECEPCIÓN' });
    const damage = await damages_model_1.default.findById('5cbdda142848880028c548d6');
    console.log('team', team);
    console.log('dist', distributor);
    console.log('rcv', receivers);
    const cars = await car_model_1.default.find({ team });
    console.log('car0', cars[0]);
    let damaged = 0;
    let total = 0;
    for (const car of cars) {
        const receiver = pickRandom(receivers);
        // recepcion
        const isDamaged = random.float() > 0.7;
        const totalMinutes = 6 * 30 * 24 * 60;
        const minutes = random.float(0, totalMinutes);
        const t0 = moment().subtract(minutes, 'minutes');
        if (isDamaged) {
            damaged += 1;
        }
        total += 1;
        const damages = generateRandomDamages(damage);
        const sections = reception.sections.map((section) => {
            return {
                _id: section._id,
                name: section.name,
                shortName: section.shortName,
                answers: section.questions.map((question) => {
                    if (question.kind === 'damage') {
                        return {
                            question: question.question,
                            kind: question.kind,
                            order: question.order,
                            weight: question.weight,
                            damagesSelected: damages
                        };
                    }
                    else {
                        return {
                            question: question.question,
                            kind: question.kind,
                            order: question.order,
                            weight: question.weight
                        };
                    }
                }),
                qualification: 0,
                weight: section.weight,
                order: section.order
            };
        });
        const participant = new participant_model_1.default({
            team,
            company,
            user,
            car,
            sections,
            name: 'RECEPCION',
            venue: distributor._id,
            sendTo: receiver,
            damagesSelected: damages
        });
        await participant.save();
        participant.createdAt = t0.toDate();
        await participant.save();
        // 2º recepcion
        const isDamaged2 = random.float() > 0.7;
        const maximum = random.float(0, 60 * 24 * 20);
        const t1 = moment(t0).add(maximum, 'minutes');
        if (isDamaged2) {
            damaged += 1;
        }
        total += 1;
        const damages2 = generateRandomDamages(damage);
        const sections2 = reception.sections.map((section) => {
            return {
                _id: section._id,
                name: section.name,
                shortName: section.shortName,
                answers: section.questions.map((question) => {
                    if (question.kind === 'damage') {
                        return {
                            question: question.question,
                            kind: question.kind,
                            order: question.order,
                            weight: question.weight,
                            damagesSelected: damages2
                        };
                    }
                    else {
                        return {
                            question: question.question,
                            kind: question.kind,
                            order: question.order,
                            weight: question.weight
                        };
                    }
                }),
                qualification: 0,
                weight: section.weight,
                order: section.order
            };
        });
        console.log('--receiver', receiver);
        const participant2 = new participant_model_1.default({
            team,
            company,
            user,
            car,
            receiveFrom: distributor._id,
            sections: sections2,
            name: 'RECEPCION 2',
            venue: receiver._id,
            damagesSelected: damages2
        });
        await participant2.save();
        participant2.createdAt = t1.toDate();
        await participant2.save();
    }
    console.log('damaged', damaged, 'total', total);
    process.exit(1);
}
generateFormData();
//# sourceMappingURL=generateFormData.js.map