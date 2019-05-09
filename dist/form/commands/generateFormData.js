"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bluebird = require("bluebird");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const path = require("path");
const random = require("random");
const moment = require("moment");
const form_model_1 = require("../models/form.model");
const venue_model_1 = require("../../app/models/venue.model");
const team_model_1 = require("../../app/models/team.model");
const car_model_1 = require("../../app/models/car.model");
const participant_model_1 = require("../models/participant.model");
const user_model_1 = require("../../app/models/user.model");
const company_model_1 = require("../../app/models/company.model");
const damages_model_1 = require("../models/damages.model");
function pickRandom(ary) {
    let index = Math.floor(random.float() * ary.length);
    return ary[index];
}
function generateRandomDamages(damage) {
    let p = random.float() * random.float() * random.float();
    let count = damage.parts.length;
    let partsTotal = Math.floor(p * count);
    var damages = [];
    for (var i = 0; i < partsTotal; i++) {
        let part = pickRandom(damage.parts);
        let kind = pickRandom(damage.kinds);
        let position = pickRandom(damage.positions);
        let newDamage = {
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
    let team = await team_model_1.default.findOne({ name: "Derco" });
    let company = await company_model_1.default.findOne({ name: "Derco" });
    let user = await user_model_1.default.findOne({ email: "richard@osacontrol.com" });
    let distributor = await venue_model_1.default.findById("5c3605307eb40314d3c46e75");
    let receivers = await venue_model_1.default.find({ team, type: "receiver" });
    let reception = await form_model_1.default.findOne({ name: "RECEPCIÓN" });
    let damage = await damages_model_1.default.findById("5cbdda142848880028c548d6");
    console.log("team", team);
    console.log("dist", distributor);
    console.log("rcv", receivers);
    let cars = await car_model_1.default.find({ team });
    console.log("car0", cars[0]);
    var damaged = 0;
    var total = 0;
    for (let car of cars) {
        let receiver = pickRandom(receivers);
        // recepcion
        let isDamaged = random.float() > 0.7;
        let totalMinutes = 6 * 30 * 24 * 60;
        let minutes = random.float(0, totalMinutes);
        let t0 = moment().subtract(minutes, 'minutes');
        if (isDamaged)
            damaged += 1;
        total += 1;
        let damages = generateRandomDamages(damage);
        let sections = reception.sections.map((section) => {
            return {
                _id: section._id,
                name: section.name,
                shortName: section.shortName,
                answers: section.questions.map((question) => {
                    if (question.kind == 'damage')
                        return {
                            question: question.question,
                            kind: question.kind,
                            order: question.order,
                            weight: question.weight,
                            damagesSelected: damages
                        };
                    else
                        return {
                            question: question.question,
                            kind: question.kind,
                            order: question.order,
                            weight: question.weight
                        };
                }),
                qualification: 0,
                weight: section.weight,
                order: section.order
            };
        });
        let participant = new participant_model_1.default({
            team,
            company,
            user,
            car,
            sections,
            name: "RECEPCION",
            venue: distributor._id,
            sendTo: receiver,
            damagesSelected: damages
        });
        await participant.save();
        participant.createdAt = t0.toDate();
        await participant.save();
        // 2º recepcion
        let isDamaged2 = random.float() > 0.7;
        let maximum = random.float(0, 60 * 24 * 20);
        let t1 = moment(t0).add(maximum, 'minutes');
        if (isDamaged2)
            damaged += 1;
        total += 1;
        let damages2 = generateRandomDamages(damage);
        let sections2 = reception.sections.map((section) => {
            return {
                _id: section._id,
                name: section.name,
                shortName: section.shortName,
                answers: section.questions.map((question) => {
                    if (question.kind == 'damage')
                        return {
                            question: question.question,
                            kind: question.kind,
                            order: question.order,
                            weight: question.weight,
                            damagesSelected: damages2
                        };
                    else
                        return {
                            question: question.question,
                            kind: question.kind,
                            order: question.order,
                            weight: question.weight
                        };
                }),
                qualification: 0,
                weight: section.weight,
                order: section.order
            };
        });
        console.log("--receiver", receiver);
        let participant2 = new participant_model_1.default({
            team,
            company,
            user,
            car,
            receiveFrom: distributor._id,
            sections: sections2,
            name: "RECEPCION 2",
            venue: receiver._id,
            damagesSelected: damages2
        });
        await participant2.save();
        participant2.createdAt = t1.toDate();
        await participant2.save();
        //process.exit(1)
    }
    console.log("damaged", damaged, "total", total);
    process.exit(1);
}
generateFormData();
//# sourceMappingURL=generateFormData.js.map