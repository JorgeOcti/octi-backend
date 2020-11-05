"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bluebird = require("bluebird");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const path = require("path");
const team_model_1 = require("../models/team.model");
const teamSetting_model_1 = require("../models/teamSetting.model");
async function createTeamSettings() {
    /*
    * Generate teams and associate if necessary.
    * - Create Team
    * - Assing cars to team
    * - Assing forms to team
    * - Assing participant to team
    * - Assing scalas to team
    * - Assign users to team
    * - Assign venes to team
    * - Assing company to team
    *
    * fixed does not change field updatedAt in collections
    * */
    dotenv.config({
        path: path.join(__dirname, '../../../.env')
    });
    const MONGODB_URI = process.env.MONGODB_URI || '';
    mongoose.Promise = bluebird;
    await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    mongoose.set('debug', true);
    try {
        const teams = await team_model_1.default.find().populate([{
                path: 'settings'
            }]);
        for (const team of teams) {
            if (team.settings === null) {
                console.log(team.name);
                await teamSetting_model_1.default.create({
                    team,
                    inventory: {
                        pending: "Pendientes",
                        pendingClass: "aqua",
                        pendingColor: "#00c2f4",
                        found: "Encontrados",
                        foundClass: "green",
                        foundColor: "#00aa51",
                        missing: "Faltantes",
                        missingClass: "red",
                        missingColor: "#f1392c",
                        leftover: "Sobrantes",
                        leftoverClass: "yellow",
                        leftoverColor: "#ff9600",
                        leftoverDifferentVenue: false,
                        reported: "Reportados",
                        reportedClass: "gray-dark",
                        reportedColor: "#96a4b3",
                    }
                });
            }
        }
    }
    catch (e) {
        console.log('Ha ocurrido un error en createTeamSettings');
        console.log('error:', e);
    }
    process.exit(1);
}
createTeamSettings();
//# sourceMappingURL=createTeamSetting.js.map