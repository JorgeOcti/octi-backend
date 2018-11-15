import * as bluebird from 'bluebird';
import * as dotenv from 'dotenv';
import * as mongoose from 'mongoose';
import * as path from 'path';
import Company from '../models/company.model';
import Team from '../models/team.model';
import User from '../models/user.model';

async function addTeamToCompany() {
  /*
  * Generate teams and associate if necessary.
  * - Assign users to team
  * - Assing company to team
  * */
  dotenv.config({
    path: path.join(__dirname, '../../../.env')
  });
  const MONGODB_URI: string = process.env.MONGODB_URI || '';
  console.log('MONGODB_URI', MONGODB_URI);
  (mongoose as any).Promise = bluebird;
  await mongoose.connect(MONGODB_URI, {
    useMongoClient: true
  });
  const companies = await Company.find({});
  try {
    for (const company of companies) {
      console.log('Procesando -->', company.name);
      // search team
      let team = await Team.findOne({
        name: company.name
      });
      // if not existe team
      if (!team) {
        // create team
        team = await new Team({
          name: company.name
        }).save();
        // assign company
        company.team = team;
        await company.save();
      }
      // assign users
      await User.update({company}, {team}, {multi: true});
    }
  } catch (e) {
    console.log('Ha ocurrido un error en addTeamToCompany');
    console.log('error:', e);
  }
  process.exit(1);
}

addTeamToCompany();
