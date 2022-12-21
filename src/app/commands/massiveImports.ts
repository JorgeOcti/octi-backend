import * as bluebird from 'bluebird';
import * as dotenv from 'dotenv';
import * as moment from 'moment-timezone';
import * as mongoose from 'mongoose';
import * as path from 'path';

import { Car, IUserModel, Venue } from '../../app/models';
import Form, { IFormModel } from '../../form/models/form.model';

import Damages from '../../form/models/damages.model';
import History from '../../app/models/history.model';
import { ICarLocation } from '../../app/interfaces/car.interface';
import { IParticipant } from 'form/interfaces';
import Kind from '../../form/models/kind.model';
import Part from '../../form/models/part.model';
import Participant from '../../form/models/participant.model';
import Position from '../../form/models/position.model';
import Team from '../../app/models/team.model';
import User from '../../app/models/user.model';
import carTracker from '../../app/controllers/tracker/car.tracker';

// import { Workbook } from 'exceljs';

const reader = require('xlsx');

// async function wait(ms: number) {
//   return new Promise(resolve => {
//     setTimeout(resolve, ms);
//   });
// }

async function makeControl(currRow: any, form: IFormModel, user: IUserModel): Promise<any> {
  return new Promise(async (resolve, reject) => {
    try {

      if (!user) {
        console.log('No existe el usuario');
        process.exit(1);
      }

      const { team, company, venue } = user;
      const car = await Car.findOne({
        vin: currRow.vin,
        team
      }, { _id: 1, vin: 1, createdAt: 1 });
      if (!car) {
        console.log('No existe el vehículo')
        process.exit(1);
      }
      const participantObject: mongoose.HydratedDocument<IParticipant> = {
        name: form.name,
        team,
        company,
        form: form._id,
        user: user._id,
        car: car._id,
        venue,
        sections: [],
        deliveryToCustomer: form.deliveryToCustomer,
        description: form.description,
        deliveryInfo: {},
        kind: form.kind,
        imported: true,
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
        participantObject.createdAt = moment(currRow.createdAt, 'MM/DD/YY').add(8, 'hours').utc().toISOString();
        participantObject.updatedAt = moment(currRow.createdAt, 'MM/DD/YY').add(8, 'hours').utc().toISOString();
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
        resolve({
          insertOne: {
            document: participantObject
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
    await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    mongoose.set('debug', debug);
    new Damages();
    new Part();
    new Position();
    new Kind();

    const fileLocation = path.join(__dirname, './massive.xlsx');

    // const workbook = new Workbook();
    // await workbook.xlsx.readFile(fileLocation)
    // const workSheet = workbook.getWorksheet("DATA");

    const file = reader.readFile(fileLocation)
    const workSheet = reader.utils
      .sheet_to_json(file.Sheets[file.SheetNames[0]], {
        raw: false
      })

    // INGRESO PDI DERCO LBZ
    const form = await Form
      .findOne({ _id: '6295342faf30b42d87b6eedb' })
      .populate([{
        path: 'sections.questions.scale'
      }, {
        path: 'sections.questions.damages',
        select: ['name', 'positions', 'kinds', 'parts'],
        populate: [{
          path: 'positions',
          select: ['name']
        }, {
          path: 'kinds',
          select: ['name']
        }, {
          path: 'parts',
          select: ['name']
        }]
      }]);
    const user = await User.findOne({
      _id: '61c2152bbd455b001337cbf6'
    }, {
      _id: 1,
      team: 1,
      company: 1,
      venue: 1
    })
    const bulkParticipants: any[] = [];
    const vins = []
    for (const row of workSheet) {
      if (form && user && !debug) {
        console.log(row.vin)
        vins.push(row.vin);
        bulkParticipants.push(await makeControl(row, form, user));
      }
    }
    if (bulkParticipants.length > 0) {
      // console.log(bulkParticipants);
      while (bulkParticipants.length) {
        console.log(bulkParticipants.length)
        const bulk = await Participant.bulkWrite(bulkParticipants.splice(0, 10))
        for(const participant of Object.values(bulk.insertedIds)){
          await carTracker.fromParticipant({ id: participant });
        }
        //
      }
    }
    const fixCarLocations = true;
    if (fixCarLocations && user) {
      console.log('Fixing car locations');
      const locationByID: any = {}
      const historiesToUpdate: any[] = [];
      const carsToUpdate: any[] = [];
      const { team } = user;
      await Venue
        .find({
          team,
          active: true,
          deleted: false
        })
        .cursor()
        .eachAsync(async (venue) => {
          return new Promise(async (resolve, reject) => {
            try {
              locationByID[venue._id.toString()] = {
                _id: venue._id,
                name: venue.name,
                company: venue.company,
                team: venue.team
              }
              resolve({});
            } catch (error) {
              console.log(error);
              reject();
            }
          })
        }, { parallel: 1 });

      const carCursor = Car
        .aggregate([
          {
            '$match': {
              'event': {
                '$exists': true
              },
              team,
              'vin': {
                '$in': vins
              }
            }
          }, {
            '$lookup': {
              'from': 'histories',
              'localField': '_id',
              'foreignField': 'car',
              'as': 'events'
            }
          }, {
            '$project': {
              'events': {
                '$filter': {
                  'input': '$events',
                  'as': 'event',
                  'cond': {
                    '$in': [
                      '$$event.status', [
                        'available', 'inTransit', 'sale'
                      ]
                    ]
                  }
                }
              }
            }
          }, {
            '$project': {
              'events._id': 1,
              'events.to': 1,
              'events.executedAt': 1
            }
          }
        ])
        .allowDiskUse(true)
        .cursor()

      await carCursor.eachAsync(async (car: any) => {
        return new Promise((resolve, reject) => {
          console.log('carsToUpdate', carsToUpdate.length);
          console.log('historiesToUpdate', historiesToUpdate.length);
          try {
            let currentLocation: Partial<ICarLocation> = {};
            let lastEventID: any;
            const { events } = car;
            const sortedEvents = events.sort((a: any, b: any) => {
              return moment(a.executedAt).unix() - moment(b.executedAt).unix()
            });
            for (const event of sortedEvents) {
              if (
                locationByID.hasOwnProperty(event?.to) && (
                  !currentLocation.hasOwnProperty('venue') ||
                  currentLocation?.venue?._id?.toString() !== event.to.toString()
                )
              ) {
                currentLocation = {
                  venue: locationByID[event.to],
                  checkedDate: event.executedAt
                };
                lastEventID = event._id;
                historiesToUpdate.push({
                  updateOne: {
                    filter: { _id: event._id },
                    update: {
                      $set: {
                        changeLocation: true
                      }
                    }
                  }
                });
              }
            }
            if (currentLocation) {
              carsToUpdate.push({
                updateOne: {
                  filter: { _id: car._id },
                  update: {
                    $set: {
                      event: lastEventID,
                      'meta.location': currentLocation
                    }
                  }
                }
              });
            }
            // if(carsToUpdate.length > 2){
            //   console.log('---------');
            //   // console.log(sortedEvents);
            //   console.log(carsToUpdate[carsToUpdate.length-1].updateOne.update);
            // }

            // if(historiesToUpdate.length < 3){
            //   console.log(historiesToUpdate[historiesToUpdate.length -1].updateOne.update);
            // }
            resolve({});
          } catch (error) {
            console.log(error);
            reject(error);
          }
        });
      }, { parallel: 100 });

      await History.bulkWrite(historiesToUpdate);
      await Car.bulkWrite(carsToUpdate);
      console.log('termino');
    }

    process.exit(1);
  } catch (e) {
    console.log(e);
    process.exit(1);
  }
}

importMassive();
