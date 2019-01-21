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
  const MONGODB_URI: string = process.env.MONGODB_URI || '';
  (mongoose as any).Promise = bluebird;
  await mongoose.connect(MONGODB_URI, {
    useMongoClient: true
  });
  mongoose.set('debug', false);
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
      // await Car.update({company}, {team}, {multi: true});
      await mongoose.connection.db.collection('cars').updateMany(
        {company: company._id},
        {$set: {team: team._id}}
      );
      // assing teams
      // await Inventory.update({company}, {team}, {multi: true});
      await mongoose.connection.db.collection('inventories').updateMany(
        {company: company._id},
        {$set: {team: team._id}}
      );
      // assing teams
      // await Form.update({company}, {team}, {multi: true});
      await mongoose.connection.db.collection('forms').updateMany(
        {company: company._id},
        {$set: {team: team._id}}
      );
      // assing participants
      // await Participant.update({company}, {team}, {multi: true});
      await mongoose.connection.db.collection('participants').updateMany(
        {company: company._id},
        {$set: {team: team._id}}
      );
      // assing teams
      // await Scale.update({company}, {team}, {multi: true});
      await mongoose.connection.db.collection('scales').updateMany(
        {company: company._id},
        {$set: {team: team._id}}
      );
      // assign Venues
      // await User.update({company}, {team}, {multi: true});
      await mongoose.connection.db.collection('users').updateMany(
        {company: company._id},
        {$set: {team: team._id}}
      );
      // assign Venues
      // await Venue.update({company}, {team}, {multi: true});
      await mongoose.connection.db.collection('venues').updateMany(
        {company: company._id},
        {$set: {team: team._id}}
      );
      // assign alerts
      // await Alert.update({company}, {team}, {multi: true});
      await mongoose.connection.db.collection('alerts').updateMany(
        {company: company._id},
        {$set: {team: team._id}}
      );
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
