import * as bluebird from 'bluebird';
import * as dotenv from 'dotenv';
import * as moment from 'moment-timezone';
import * as mongoose from 'mongoose';
import * as path from 'path';

import Car from '../models/car.model';
import { IUserModel } from '../schemas/user.schema';
import {  IVenueModel } from '../models/venue.model';
import Venue from '../models/venue.model';
import Form, { IFormModel } from '../../form/models/form.model';

import Damages from '../../form/models/damages.model';
import History from '../models/history.model';
// import { ICarLocation } from '../interfaces/car.interface';
import Kind from '../../form/models/kind.model';
import Part from '../../form/models/part.model';
import Participant from '../../form/models/participant.model';
import Position from '../../form/models/position.model';
import Team from '../models/team.model';
import User from '../models/user.model';
// import carTracker from '../controllers/tracker/car.tracker';
const reader = require('xlsx');

// async function wait(ms: number) {
//   return new Promise(resolve => {
//     setTimeout(resolve, ms);
//   });
// }

async function makeControl(
  currRow: any,
  form: IFormModel,
  user: IUserModel,
  venue: IVenueModel
): Promise<any> {
  return new Promise(async (resolve, reject) => {
    try {
      if (!user) {
        console.log('No existe el usuario');
        process.exit(1);
      }

      const { team, company } = user;
      const car = await Car.findOne(
        {
          vin: currRow.vin,
          team
        },
        { _id: 1, vin: 1, createdAt: 1 }
      );
      if (!car) {
        console.log('No existe el vehículo');
        process.exit(1);
      }
      const participantObject: any = {
        name: form.name,
        team,
        company,
        form: form._id,
        user: user._id,
        car: car._id,
        venue: venue._id,
        sections: [],
        deliveryToCustomer: form.deliveryToCustomer,
        description: form.description,
        deliveryInfo: {},
        kind: form.kind,
        imported: true,
        qualification: 0,
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
            qualification: 0,
            answer: null,
            comment: '',
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
          qualification: 0,
          answers: newAnswers,
          weight: section.weight,
          order: section.order
        });
      }
      const updateTeam = await Team.findOneAndUpdate(
        {
          _id: team._id
        },
        {
          $inc: { formsNumber: 1 }
        },
        {
          new: true
        }
      );
      if (updateTeam) {
        participantObject.number = updateTeam.formsNumber;
        participantObject.createdAt = moment(currRow.createdAt, 'MM/DD/YY')
          .add(8, 'hours')
          .utc()
          .toISOString();
        participantObject.updatedAt = moment(currRow.createdAt, 'MM/DD/YY')
          .add(8, 'hours')
          .utc()
          .toISOString();
        // console.log(participantObject)
        // console.log(participantObject.sections[0].answers)
        // const participant = new Participant(participantObject);
        // await participant.save();
        // await Participant.updateOne({ _id: participant._id }, {
        //   $set: {
        //     createdAt: moment(currRow.createdAt).toISOString(),
        //     updatedAt: moment(currRow.createdAt).toISOString()
        //   }
        // }, { timestamps: false })
        // await Participant.create(participantObject, { timestamps: false });
        const existParticipant = await Participant.findOne({
          createdAt: participantObject.createdAt,
          user: user._id,
          car: car._id,
          // venue: '639780224e5d4600cc76b563'
          venue: '63fe66c4078da800128e4f04'
        })
        if(existParticipant) {
        await History.updateOne({ participant: existParticipant._id }, {$set:{
          from: '63fe66c4078da800128e4f04',
          to: '63fe66c4078da800128e4f04',
        }})
      }

        // console.log("existParticipant", existParticipant)
        resolve({
          updateOne: {
            filter: {
              createdAt: participantObject.createdAt,
              user: user._id,
              car: car._id,
            },
            update: participantObject
          }
        });
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
    const debug = false;
    const MONGODB_URI: string = process.env.MONGODB_URI || '';
    (mongoose as any).Promise = bluebird;
    await mongoose.connect(MONGODB_URI, {});
    mongoose.set('debug', debug);
    new Damages();
    new Part();
    new Position();
    new Kind();

    const fileLocation = path.join(__dirname, './massive.xlsx');

    // const workbook = new Workbook();
    // await workbook.xlsx.readFile(fileLocation)
    // const workSheet = workbook.getWorksheet("DATA");

    const file = reader.readFile(fileLocation);
    const workSheet = reader.utils.sheet_to_json(
      file.Sheets[file.SheetNames[0]],
      {
        raw: false
      }
    );

    // INGRESO PDI DERCO LBZ # 6295342faf30b42d87b6eedb
    // INGRESO NOVICIADO # 63989de20000000000b837a0
    // INGRESO LONQUÉN # 63989dfe0000000000b837fe
    const form = await Form.findOne({
      _id: '6295342faf30b42d87b6e7dc'
    }).populate([
      {
        path: 'sections.questions.scale'
      },
      {
        path: 'sections.questions.damages',
        select: ['name', 'positions', 'kinds', 'parts'],
        populate: [
          {
            path: 'positions',
            select: ['name']
          },
          {
            path: 'kinds',
            select: ['name']
          },
          {
            path: 'parts',
            select: ['name']
          }
        ]
      }
    ]);
    // Eduardo 61c2152bbd455b001337cbf6
    const user = await User.findOne(
      {
        _id: '61c2152bbd455b001337cbf6'
      },
      {
        _id: 1,
        team: 1,
        company: 1,
        venue: 1
      }
    );
    // LO BOZA 5b180822ac84533e5226cea1
    // CD CD NOVICIADO TRANSAUTO 639780224e5d4600cc76b563
    // CD LONQUÉN SCHIAPPACASSE 63977ffc6ea6ad00c32cfc22
    const venue = await Venue.findOne(
      {
        _id: '63fe66c4078da800128e4f04'
      },
      {
        _id: 1
      }
    );
    let bulkParticipants: any[] = [];
    const vins = [];
    const makeControls = [];
    for (const row of workSheet) {
      console.log(row.vin);
      if (form && user && venue && !debug) {
        vins.push(row.vin);
        makeControls.push(makeControl(row, form, user, venue));
      }
    }
    while (makeControls.length) {
      const controls = await Promise.all(makeControls.splice(0, 100));
      bulkParticipants = [...bulkParticipants, ...controls]
    }
    console.log("bulkParticipants.length", bulkParticipants.length);
    const execute = true;
    if (execute && bulkParticipants.length > 0) {
      while (bulkParticipants.length) {
        console.log(bulkParticipants.length);
        const bulk = await Participant.bulkWrite(
          bulkParticipants.splice(0, 100)
        );
        console.log(bulk);
        // const carTrackers = []
        // for (const participant of Object.values(bulk.insertedIds)) {
        //   carTrackers.push({
        //     updateOne: {
        //       filter: {
        //         participant,
        //       },
        //       update: {

        //       }
        //     }
        //   });
        // }
        // await History.bulkWrite(carTrackers);
      }
    }
    console.log('Done');

    process.exit(1);
  } catch (e) {
    console.log(e);
    process.exit(1);
  }
}

importMassive();
