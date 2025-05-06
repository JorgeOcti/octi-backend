import * as bluebird from 'bluebird';
import * as dotenv from 'dotenv';
import * as mongoose from 'mongoose';
import * as path from 'path';
import Team from "../../models/team.model";
import TeamSetting from "../../models/teamSetting.model";

async function createTeamSettings() {
  /*
  * Generate teams and associate if necessary.
  * - Create Team
  * - Assing cars to team
  * - Assing forms to team
  * - Assing participant to team
  * - Assing scalas to team
  * - Assign users to team
  * - Assign venes to team+
  * - Assing company to team
  *
  * fixed does not change field updatedAt in collections
  * */
  dotenv.config({
    path: path.join(__dirname, '../../../.env')
  });
  const MONGODB_URI: string = process.env.MONGODB_URI || '';
  (mongoose as any).Promise = bluebird;
  await mongoose.connect(MONGODB_URI);
  mongoose.set('debug', true);
  try {
    const teams = await Team.find().populate([{
      path: 'settings'
    }]);
    for (const team of teams) {
      if(team.settings === null){
        console.log(team.name);
        await new TeamSetting({
          team,
          inventory:{
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
            open: "Abierto",
            openClass: "orange",
            openColor: "#ff851b",
            check: "Descarga",
            checkClass: "yellow",
            checkColor: "#f39c12"
          }
        }).save();
      }
    }
  } catch (e) {
    console.log('Ha ocurrido un error en createTeamSettings');
    console.log('error:', e);
  }
  process.exit(1);
}

createTeamSettings();
