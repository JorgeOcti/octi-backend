import * as bluebird from 'bluebird';
import * as dotenv from 'dotenv';
import * as mongoose from 'mongoose';
import * as path from 'path';

import Form, { IFormModel } from '../../form/models/form.model';
import { IUserModel, User } from '../../app/models';

import { IParticipant } from 'form/interfaces';
import Participant from '../../form/models/participant.model';
import Team from '../../app/models/team.model';
import { Workbook } from 'exceljs';

async function makeControl(form: IFormModel, user: IUserModel) {
  return new Promise(async (resolve, reject) => {
    try {
      const { team, company } = user;
      const participantObject: mongoose.HydratedDocument<IParticipant> = {
        name: form.name,
        team,
        company,
        form: form._id,
        user: user._id,
        car: '',
        venue: '',
        deliveryToCustomer: form.deliveryToCustomer,
        description: form.description,
        deliveryInfo: {},
        kind: form.kind,
        updatedAt: true,
        active: form.active
      };
      if (form.reception) {
        participantObject.reception = form.reception;
        participantObject.receptionText = form.receptionText;
        participantObject.receptionVenue = form.receptionVenue;
        participantObject.receptionVenueText = form.receptionVenueText;
        participantObject.receptionConfirmation = true;
      }
      if (form.shipping) {
        participantObject.shipping = form.shipping;
        participantObject.shippingText = form.shippingText;
        participantObject.shippingVenue = form.shippingVenue;
        participantObject.shippingVenueText = form.shippingVenueText;
        participantObject.shippingConfirmation = true;
      }
      for (const section of form.sections) {
        const newAnswers: any[] = [];
        for (const question of section.questions) {
          newAnswers.push({
            _id: question._id,
            question: question.question,
            kindUpdate: question?.kindUpdate,
            shortName: question.shortName,
            scale: question.scale,
            conciliation: question.conciliation,
            accessories: question.accessories,
            damages: question.damages,
            damagesSelected: [],
            accesoriesAnswered: [],
            risk: question.risk,
            observe: question.observe,
            images: [],
            weight: question.weight,
            kind: question.kind,
            order: question.order,
            hint: question.hint,
            optional: question.optional,
            minValue: question.minValue,
            maxValue: question.maxValue,
            requireSeverity: question.requireSeverity
          });
        }
        participantObject.sections.push({
          _id: section._id,
          name: section.name,
          shortName: section.shortName,
          answers: newAnswers,
          weight: section.weight,
          order: section.order
        });
      }
      const updateTeam = await Team.findOneAndUpdate({
        _id: team._id
      }, {
        $inc: { formsNumber: 1 }
      }, {
        new: true
      });
      if (updateTeam) {
        participantObject.number = updateTeam.formsNumber;
        await Participant.create(participantObject, { timestamps: false });
        resolve(true);
      } else {
        reject('No se pudo actualizar el equipo');
      }
    } catch (error) {
      reject(error);
      console.log(error);
    }
  });
}
async function importMassive() {
  try {
    dotenv.config({
      path: path.join(__dirname, '../../../.env')
    });
    const MONGODB_URI: string = process.env.MONGODB_URI || '';
    (mongoose as any).Promise = bluebird;
    await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    mongoose.set('debug', false);

    const fileLocation = path.join(__dirname, './massive.xlsx');

    const workbook = new Workbook();
    await workbook.xlsx.readFile(fileLocation)
    const workSheet = workbook.getWorksheet("DATA");

    // INGRESO PDI DERCO LBZ
    const form = await Form.findOne({ _id: '6295342faf30b42d87b6eedb' });

    workSheet.eachRow({ includeEmpty: true }, async (row, rowNumber) => {
      const currRow = workSheet.getRow(rowNumber)
      console.log('Row ' + rowNumber + ' = ', currRow.getCell(1).value);
      console.log('Row ' + rowNumber + ' = ', currRow.getCell(2).value);
      console.log('Row ' + rowNumber + ' = ', currRow.getCell(3).value);
      console.log('----------');
      const user = await User
        .findOne({ _id: '5af487b4f6a4c95ccd991466' + 1 }, { team: 1, company: 1 });
      if (form && user) {
        await makeControl(form, user);
      }
    });
    process.exit(1);
  } catch (e) {
    console.log(e);
    process.exit(1);
  }
}

importMassive();
