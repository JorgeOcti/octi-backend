import * as bluebird from 'bluebird';
import * as dotenv from 'dotenv';
import * as mongoose from 'mongoose';
import * as path from 'path';
import Form from '../../form/models/form.model';
import Scale from '../../form/models/scale.model';
import Inventory from '../../inventory/models/inventory.model';
import Car from '../models/car.model';
import Company from '../models/company.model';
import Team from '../models/team.model';
import User from '../models/user.model';
import Venue from '../models/venue.model';

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
  const MONGODB_URI: string = process.env.MONGODB_URI || '';
  (mongoose as any).Promise = bluebird;
  await mongoose.connect(MONGODB_URI, {
    useMongoClient: true
  });
  const companies = await Company.find({deleted: false});
  try {
    for (const company of companies) {
      console.log('Procesando -->', company.name);
      // search team
      let team = await Team.findOne({
        $or: [{
          name: company.name
        }, {
          _id: company.team
        }]
      });
      console.log('team', team);
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
      // assing teams
      await Car.update({company}, {team}, {multi: true});
      // assing teams
      await Inventory.update({company}, {team}, {multi: true});
      // assing teams
      await Form.update({company}, {team}, {multi: true});
      // assing teams
      await Scale.update({company}, {team}, {multi: true});
      // assign Venues
      await User.update({company}, {team}, {multi: true});
      // assign Venues
      await Venue.update({company}, {team}, {multi: true});
      // fix venues
      await User.update({deleted: {$exists: false}}, {deleted: false}, {multi: true});
      // fix companies
      await Company.update({deleted: {$exists: false}}, {deleted: false}, {multi: true});
    }
  } catch (e) {
    console.log('Ha ocurrido un error en addTeamToCompany');
    console.log('error:', e);
  }
  process.exit(1);
}

addTeamToCompany();
