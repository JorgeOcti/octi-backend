"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const company_model_1 = require("../../app/models/company.model");
const bluebird = require("bluebird");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const path = require("path");
const team_model_1 = require("../../app/models/team.model");
// import ActivityHistory, { ChoicesTypeActivity } from '../models/activityHistory.model';
async function fixBilling() {
    try {
        dotenv.config({
            path: path.join(__dirname, '../../../.env')
        });
        const MONGODB_URI = process.env.MONGODB_URI || '';
        mongoose.Promise = bluebird;
        await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
        company_model_1.default.find();
        const team = await team_model_1.default.findOne({ name: 'Salfa' })
            .populate([{
                path: 'companies'
            }]);
        if (team) {
            for (const company of team.companies) {
                console.log(company.name);
            }
        }
    }
    catch (e) {
        console.log(e);
        process.exit(1);
    }
    // await ActivityHistory.create({
    //   team,
    //   company,
    //   user: req.user._id,
    //   type: ChoicesTypeActivity.checklist,
    //   response: {
    //     _id: car._id,
    //     number: car.vin
    //   }
    // });
    // const form = await FormModel.findById('5b0487db835536612bab1b61');
    // if (form) {
    //   form.sections.forEach((section) => {
    //     section.questions.forEach((question) => {
    //       if (question._id.toString() === '5b0487db835536612bab1b66') {
    //         (question as any).accessories = {
    //           question: 'prueba',
    //           items: [{
    //             item: 'Manual usuario'
    //           }, {
    //             item: 'Póliza de garantía'
    //           }, {
    //             item: 'Copia de llaves (2)'
    //           }, {
    //             item: 'Logo patente'
    //           }, {
    //             item: 'Bolso de herramientas'
    //           }, {
    //             item: 'porta documentos'
    //           }]
    //         };
    //         // question.save();
    //         console.log('question', JSON.stringify(question));
    //       }
    //     });
    //   });
    //   form.save();
    // }
    process.exit(1);
}
fixBilling();
//# sourceMappingURL=fixBillingRequest.js.map