import * as bluebird from 'bluebird';
import * as dotenv from 'dotenv';
import * as mongoose from 'mongoose';
import * as path from 'path';
import Car from '../../models/car.model';
import Form from '../../../form/models/form.model';
import Participant from '../../../form/models/participant.model';

async function metaCarLocation() {
  dotenv.config({
    path: path.join(__dirname, '../../../.env')
  });
  const MONGODB_URI: string = process.env.MONGODB_URI || '';
  (mongoose as any).Promise = bluebird;
  await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  mongoose.set('debug', true);
  try {
    // const requestItems = await RequestItem.find({request: '6238d7949cd9b20010e557cc'}, {
    const participant = new Participant({});
    console.log(participant);
    const receptionForms = await Form.find({ reception: true }, { _id: true });
    const receptionFormsIDS = receptionForms.map(form => form.id);
    const cursor = await Car
      .find({})
      .populate([{
        path: 'lastForm',
        select: {
          form: true,
          venue: true,
          createdAt: true
        },
        populate: [{
          path: 'venue'
        }]
      }])
      .batchSize(20)
      .cursor();
    cursor.on('data', async (car) => {
      try {
        if (car.lastForm && receptionFormsIDS.includes(car.lastForm.form.toString())) {
          await Car.updateOne({ _id: car._id }, {
            'meta.location.venue': car.lastForm.venue,
            'meta.location.checkedDate': car.lastForm.createdAt
          });
        }
      } catch (e) {
        console.log('error:', e);
      }
    });
    cursor.on('end', async () => {
      process.exit(1);
    });
  } catch (e) {
    console.log('Ha ocurrido un error en metaCarLocation');
    console.log('error:', e);
  }

}

metaCarLocation();
