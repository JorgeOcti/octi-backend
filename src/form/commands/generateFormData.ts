import * as bluebird from 'bluebird';
import * as dotenv from 'dotenv';
import * as mongoose from 'mongoose';
import * as path from 'path';
import * as random from 'random';
import * as moment from 'moment';
import FormModel, {default as Form} from '../models/form.model';
import Venue from "../../app/models/venue.model";
import Team from "../../app/models/team.model";
import Car from "../../app/models/car.model";
import Participant from "../models/participant.model";
import User from "../../app/models/user.model";
import Company from "../../app/models/company.model";
import Damages from "../models/damages.model";

function pickRandom(ary: any[]): any {
  let index = Math.floor(random.float() * ary.length)
  return ary[index]
}

function generateRandomDamages(damage) {

  let p = random.float() * random.float() * random.float()
  let count = damage.parts.length

  let partsTotal = Math.floor(p * count)

  var damages = []
  for (var i = 0; i < partsTotal; i++) {

    let part = pickRandom(damage.parts)
    let kind = pickRandom(damage.kinds)
    let position = pickRandom(damage.positions)

    let newDamage = {
      part,
      kind,
      position
    }

    damages.push(newDamage)

  }
  return damages

}

async function generateFormData() {
  dotenv.config({
    path: path.join(__dirname, '../../../.env')
  });
  const MONGODB_URI: string = process.env.MONGODB_URI || '';
  (mongoose as any).Promise = bluebird;
  await mongoose.connect(MONGODB_URI, {useMongoClient: true});
  // form 5b0487db835536612bab1b61
  // section 5b0487db835536612bab1b65
  // question 5b0487db835536612bab1b66

  let team = await Team.findOne({name: "Derco"})
  let company = await Company.findOne({name: "Derco"})
  let user = await User.findOne({email: "richard@osacontrol.com"})
  let distributor = await Venue.findById("5c3605307eb40314d3c46e75")

  let receivers = await Venue.find({team, type: "receiver"})

  let reception = await Form.findOne({name: "RECEPCIÓN"})
  let damage = await Damages.findById("5cbdda142848880028c548d6")

  console.log("team", team)
  console.log("dist", distributor)
  console.log("rcv", receivers)

  let cars = await Car.find({team})
  console.log("car0", cars[0])

  var damaged = 0
  var total = 0

  for (let car of cars) {

    let receiver = pickRandom(receivers)

    // recepcion
    let isDamaged = random.float() > 0.7

    let totalMinutes = 6 * 30 * 24 * 60
    let minutes = random.float(0, totalMinutes)
    let t0 = moment().subtract(minutes, 'minutes')

    if (isDamaged)
      damaged += 1
    total += 1

    let damages = generateRandomDamages(damage)

    let sections = reception.sections.map((section) => {
      return {
        _id: section._id,
        name: section.name,
        shortName: section.shortName,
        answers: section.questions.map((question) => {
          if (question.kind == 'damage')
            return {
              question: question.question,
              kind: question.kind,
              order: question.order,
              weight: question.weight,
              damagesSelected: damages
            }
          else return {
            question: question.question,
            kind: question.kind,
            order: question.order,
            weight: question.weight
          }
        }),
        qualification: 0,
        weight: section.weight,
        order: section.order
      }
    })

    let participant = new Participant({
      team,
      company,
      user,
      car,
      sections,
      name: "RECEPCION",
      venue: distributor._id,
      sendTo: receiver,
      damagesSelected: damages
    })

    await participant.save()
    participant.createdAt = t0.toDate()
    await participant.save()

    // 2º recepcion
    let isDamaged2 = random.float() > 0.7

    let maximum = random.float(0, 60 * 24 * 20)
    let t1 = moment(t0).add(maximum, 'minutes')

    if (isDamaged2)
      damaged += 1
    total += 1

    let damages2 = generateRandomDamages(damage)

    let sections2 = reception.sections.map((section) => {
      return {
        _id: section._id,
        name: section.name,
        shortName: section.shortName,
        answers: section.questions.map((question) => {
          if (question.kind == 'damage')
            return {
              question: question.question,
              kind: question.kind,
              order: question.order,
              weight: question.weight,
              damagesSelected: damages2
            }
          else return {
            question: question.question,
            kind: question.kind,
            order: question.order,
            weight: question.weight
          }
        }),
        qualification: 0,
        weight: section.weight,
        order: section.order
      }
    })

    console.log("--receiver", receiver)

    let participant2 = new Participant({
      team,
      company,
      user,
      car,
      receiveFrom: distributor._id,
      sections: sections2,
      name: "RECEPCION 2",
      venue: receiver._id,
      damagesSelected: damages2
    })

    await participant2.save()
    participant2.createdAt = t1.toDate()
    await participant2.save()

    //process.exit(1)

  }

  console.log("damaged", damaged, "total", total)
  process.exit(1)

}

generateFormData();
