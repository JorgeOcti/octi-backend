import * as mongoose from 'mongoose';
import Form from '../form/models/form.model';
import Participant from '../form/models/participant.model';

mongoose.set('strictQuery', false);
mongoose.set('debug', true);
/*
* npm exec migrate create create-form-deliveryInfo-signature-and-identify-card
* npm exec migrate up create-form-deliveryInfo-signature-and-identify-card
* npm exec migrate down create-form-deliveryInfo-signature-and-identify-card
* */

// Make any changes you need to make to the database here
export async function up() {
  await this.connect(mongoose);

  /* fix form */
  await Form.updateOne({
    _id: '6058f9e53039dbadeeb7a559'
  }, {
    $set: {
      'sections.$[section].questions.$[question].kindUpdate': 'participant.clientSignature'
    }
  }, {
    arrayFilters: [{ 'question._id': '60a6c487869d19c7fbd047c3' }, { 'section._id': '60a6c487869d19c7fbd047c2' }]
  });
  await Form.updateOne({
    _id: '6058f9e53039dbadeeb7a559'
  }, {
    $set: {
      'sections.$[section].questions.$[question].kindUpdate': 'participant.clientIdentifyCard'
    }
  }, {
    arrayFilters: [{ 'question._id': '633aee200000000000b7baa4' }, { 'section._id': '60a6c487869d19c7fbd047c2' }]
  });

  /* fix participants */

  await Participant.updateMany({
    form: '6058f9e53039dbadeeb7a559'
  }, {
    $set: {
      'sections.$[section].answers.$[answer].kindUpdate': 'participant.clientSignature'
    }
  }, {
    arrayFilters: [{ 'answer._id': '60a6c487869d19c7fbd047c3' }, { 'section._id': '60a6c487869d19c7fbd047c2' }]
  });
  await Participant.updateMany({
    form: '6058f9e53039dbadeeb7a559'
  }, {
    $set: {
      'sections.$[section].answers.$[answer].kindUpdate': 'participant.clientIdentifyCard'
    }
  }, {
    arrayFilters: [{ 'answer._id': '633aee200000000000b7baa4' }, { 'section._id': '60a6c487869d19c7fbd047c2' }]
  });


  await Participant
    .find({
      form: {
        $in: ['6058f9e53039dbadeeb7a559']
      }
    })
    .batchSize(10)
    .cursor()
    .eachAsync(async (participant) => {
      return new Promise(async (resolve, reject) => {
        try {
          for (const section of participant.sections) {
            for (const answer of section.answers) {
              if (answer.kindUpdate === 'participant.clientSignature') {
                await Participant.update({ _id: participant._id }, {
                  $set: {
                    'deliveryInfo.signature': answer.images
                  }
                });
              } else if (answer.kindUpdate === 'participant.clientIdentifyCard') {
                await Participant.update({ _id: participant._id }, {
                  $set: {
                    'deliveryInfo.identifyCard': answer.images
                  }
                });
              }
            }
          }
          return resolve({});
        } catch (error) {
          console.log(error);
          return reject(error);
        }
      });
    });
}

// Make any changes that UNDO the up function side effects here (if possible)
export async function down() {
  await this.connect(mongoose);
}
