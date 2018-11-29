"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bluebird = require("bluebird");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const path = require("path");
const company_model_1 = require("../models/company.model");
const team_model_1 = require("../models/team.model");
const user_model_1 = require("../models/user.model");
async function addTeamToCompany() {
    /*
    * Generate teams and associate if necessary.
    * - Create Team
    * - Assign users to team
    * - Assing company to team
    * */
    dotenv.config({
        path: path.join(__dirname, '../../../.env')
    });
    const MONGODB_URI = process.env.MONGODB_URI || '';
    mongoose.Promise = bluebird;
    await mongoose.connect(MONGODB_URI, {
        useMongoClient: true
    });
    const companies = await company_model_1.default.find({});
    try {
        for (const company of companies) {
            console.log('Procesando -->', company.name);
            // search team
            let team = await team_model_1.default.findOne({
                name: company.name
            });
            // if not existe team
            if (!team) {
                // create team
                team = await new team_model_1.default({
                    name: company.name
                }).save();
                // assign company
                company.team = team;
                await company.save();
            }
            // assign users
            await user_model_1.default.update({ company }, { team }, { multi: true });
        }
    }
    catch (e) {
        console.log('Ha ocurrido un error en addTeamToCompany');
        console.log('error:', e);
    }
    process.exit(1);
}
addTeamToCompany();
//# sourceMappingURL=addTeamToCompany.js.map