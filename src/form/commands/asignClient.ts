import * as bluebird from 'bluebird';
import * as dotenv from 'dotenv';
import * as mongoose from 'mongoose';
import * as path from 'path';

import Form from '../models/form.model';
import Participant from '../models/participant.model';

// ts-node src/form/commands/asignClient.ts
// node dist/form/commands/asignClient.js
async function asignClient() {
  dotenv.config({
    path: path.join(__dirname, '../../../.env')
  });
  const MONGODB_URI: string = process.env.MONGODB_URI || '';
  (mongoose as any).Promise = bluebird;
  mongoose.set('debug', true);
  await mongoose.connect(MONGODB_URI,  {});

  // Derco
  /* fix form */
  await Form.updateOne({
    _id: '6058f9e53039dbadeeb7a559'
  }, {
    $set: {
      'sections.$[section].questions.$[question].kindUpdate': 'participant.clientName'
    }
  }, {
    arrayFilters: [{ 'question._id': '6058f9e53039dbadeeb7a55b' }, { 'section._id': '6058f9e53039dbadeeb7a55a' }]
  });
  await Form.updateOne({
    _id: '6058f9e53039dbadeeb7a559'
  }, {
    $set: {
      'sections.$[section].questions.$[question].kindUpdate': 'participant.clientEmail'
    }
  }, {
    arrayFilters: [{ 'question._id': '6058f9e53039dbadeeb7a55e' }, { 'section._id': '6058f9e53039dbadeeb7a55a' }]
  });
  await Form.updateOne({
    _id: '6058f9e53039dbadeeb7a559'
  }, {
    $set: {
      'sections.$[section].questions.$[question].kindUpdate': 'participant.order'
    }
  }, {
    arrayFilters: [{ 'question._id': '6058f9e53039dbadeeb7a55c' }, { 'section._id': '6058f9e53039dbadeeb7a55a' }]
  });

  /* fix participants */

  await Participant.updateMany({
    form: '6058f9e53039dbadeeb7a559'
  }, {
    $set: {
      'sections.$[section].answers.$[answer].kindUpdate': 'participant.clientName'
    }
  }, {
    arrayFilters: [{ 'answer._id': '6058f9e53039dbadeeb7a55b' }, { 'section._id': '6058f9e53039dbadeeb7a55a' }]
  });
  await Participant.updateMany({
    form: '6058f9e53039dbadeeb7a559'
  }, {
    $set: {
      'sections.$[section].answers.$[answer].kindUpdate': 'participant.clientEmail'
    }
  }, {
    arrayFilters: [{ 'answer._id': '6058f9e53039dbadeeb7a55e' }, { 'section._id': '6058f9e53039dbadeeb7a55a' }]
  });
  await Participant.updateMany({
    form: '6058f9e53039dbadeeb7a559'
  }, {
    $set: {
      'sections.$[section].answers.$[answer].kindUpdate': 'participant.order'
    }
  }, {
    arrayFilters: [{ 'answer._id': '6058f9e53039dbadeeb7a55c' }, { 'section._id': '6058f9e53039dbadeeb7a55a' }]
  });

  // Salfa
  /* fix form */
  await Form.updateOne({
    _id: '6318284300000000003b7676'
  }, {
    $set: {
      'sections.$[section].questions.$[question].kindUpdate': 'participant.clientName'
    }
  }, {
    arrayFilters: [{ 'question._id': '6318284300000000003b7678' }, { 'section._id': '6318284300000000003b7677' }]
  });
  await Form.updateOne({
    _id: '6318284300000000003b7676'
  }, {
    $set: {
      'sections.$[section].questions.$[question].kindUpdate': 'participant.clientRut'
    }
  }, {
    arrayFilters: [{ 'question._id': '6318284300000000003b7679' }, { 'section._id': '6318284300000000003b7677' }]
  });
  await Form.updateOne({
    _id: '6318284300000000003b7676'
  }, {
    $set: {
      'sections.$[section].questions.$[question].kindUpdate': 'participant.clientEmail'
    }
  }, {
    arrayFilters: [{ 'question._id': '6318284300000000003b767a' }, { 'section._id': '6318284300000000003b7677' }]
  });

  /* fix participants */
  await Participant.updateMany({
    form: '6318284300000000003b7676'
  }, {
    $set: {
      'sections.$[section].answers.$[answer].kindUpdate': 'participant.clientName'
    }
  }, {
    arrayFilters: [{ 'answer._id': '6318284300000000003b7678' }, { 'section._id': '6318284300000000003b7677' }]
  });
  await Participant.updateMany({
    form: '6318284300000000003b7676'
  }, {
    $set: {
      'sections.$[section].answers.$[answer].kindUpdate': 'participant.clientRut'
    }
  }, {
    arrayFilters: [{ 'answer._id': '6318284300000000003b7679' }, { 'section._id': '6318284300000000003b7677' }]
  });
  await Participant.updateMany({
    form: '6318284300000000003b7676'
  }, {
    $set: {
      'sections.$[section].answers.$[answer].kindUpdate': 'participant.clientEmail'
    }
  }, {
    arrayFilters: [{ 'answer._id': '6318284300000000003b767a' }, { 'section._id': '6318284300000000003b7677' }]
  });


  const cursor = await Participant.find({
    form: {
      $in: ['6318284300000000003b7676', '6058f9e53039dbadeeb7a559']
    }
  }).cursor();

  await cursor.eachAsync(async (participant) => {
    return new Promise(async (resolve, reject) => {
      try {
        for (const section of participant.sections) {
          for (const answer of section.answers) {
            if (answer.kindUpdate === 'participant.clientName') {
              await Participant.update({ _id: participant._id }, {
                $set: {
                  'deliveryInfo.name': answer.comment
                }
              });
            } else if (answer.kindUpdate === 'participant.clientEmail') {
              await Participant.update({ _id: participant._id }, {
                $set: {
                  'deliveryInfo.email': answer.comment
                }
              });
            } else if (answer.kindUpdate === 'participant.clientRut') {
              await Participant.update({ _id: participant._id }, {
                $set: {
                  'deliveryInfo.rut': answer.comment
                }
              });
            } else if (answer.kindUpdate === 'participant.order') {
              await Participant.update({ _id: participant._id }, {
                $set: {
                  'deliveryInfo.order': answer.comment
                }
              });
            }
            resolve({})
          }
        }
      } catch (error) {
        console.log(error);
        reject(error);
      }
    });
  });

  cursor.close();
  process.exit(1);

}

asignClient();
