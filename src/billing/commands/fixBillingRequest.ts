import Company from '../../app/models/company.model';
import * as bluebird from 'bluebird';
import * as dotenv from 'dotenv';
import * as mongoose from 'mongoose';
import * as path from 'path';
import Team from '../../app/models/team.model';
// import ActivityHistory, { ChoicesTypeActivity } from '../models/activityHistory.model';

async function fixBilling() {
  try {
    dotenv.config({
      path: path.join(__dirname, '../../../.env')
    });
    const MONGODB_URI: string = process.env.MONGODB_URI || '';
    (mongoose as any).Promise = bluebird;
    await mongoose.connect(MONGODB_URI, {useNewUrlParser: true,  useUnifiedTopology: true});
    Company.find();
    const team = await Team.findOne({ name: 'Salfa' })
      .populate([{
        path: 'companies'
      }]);
    if(team){
      for(const company of team.companies!){
        console.log(company.name);
      }
    }
  } catch(e){
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
