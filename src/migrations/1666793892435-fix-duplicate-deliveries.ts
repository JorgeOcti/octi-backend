import * as mongoose from 'mongoose';
import * as moment from 'moment';
import Participant from '../form/models/participant.model';
import { Types } from 'mongoose';

mongoose.set('strictQuery', false);
mongoose.set('debug', true);

/*
* Migration: fix-duplicate-deliveries
* npm exec migrate up fix-duplicate-deliveries
* npm exec migrate down fix-duplicate-deliveries
* */

// Make any changes you need to make to the database here
export async function up() {
  await this.connect(mongoose);
  const form = new Types.ObjectId('6058f9e53039dbadeeb7a559');
  const duplicateDeliveries = await Participant.aggregate([
    {
      '$match': {
        'team': new Types.ObjectId('5bf2de34caf8ef7096105cda'),
        'form': form
      }
    }, {
      '$group': {
        '_id': {
          'car': '$car',
          'user': '$user',
          'order': '$deliveryInfo.order',
          'name': '$deliveryInfo.name',
          'email': '$deliveryInfo.email',
          'fecha': {
            '$dateToString': {
              'format': '%Y-%m-%d',
              'date': '$createdAt'
            }
          }
        },
        'count': {
          '$sum': 1
        }
      }
    }, {
      '$match': {
        'count': {
          '$gte': 2
        }
      }
    }
  ]);
  for (const duplicateDelivery of duplicateDeliveries) {
    const controls = await Participant.find({
      'car': duplicateDelivery._id.car,
      'user': duplicateDelivery._id.user,
      'form': form,
      'deliveryInfo.order': duplicateDelivery._id.order,
      'deliveryInfo.name': duplicateDelivery._id.name,
      'deliveryInfo.email': duplicateDelivery._id.email,
      'createdAt': {
        $gte: moment(duplicateDelivery._id.fecha).startOf('day'),
        $lte: moment(duplicateDelivery._id.fecha).endOf('day')
      }
    }, { _id: 1, createdAt: 1 }).sort({ createdAt: 1 }).lean();
    if (controls.length) {
      const first = controls.shift();
      await Participant.deleteMany({ _id: { $in: controls.map((c) => c._id) } });
      console.log(duplicateDelivery._id.car, { first, controls });
    }
  }
  await Participant.deleteMany({
    venue: {
      $in: [
        // Yusic - Pre entrega Antofagasta
        new Types.ObjectId('60931501679f110011834282'),
        // Lo Boza CES
        new Types.ObjectId('60c1649e9c198d0011c3e7c7')
      ]
    }
  });
  await Participant.deleteMany({
    user: {
      $in: [
        // roderick+derco@osacontrol.com
        new Types.ObjectId('5da721375a6bd90019d8660b'),
        // roderick+ces@osacontrol.com
        new Types.ObjectId('6094160906b6390014fabb47'),
        // dmorales+derco@osacontrol.com
        new Types.ObjectId('6059092172e33d001285d97c')
      ]
    }
  });
}

// Make any changes that UNDO the up function side effects here (if possible)
export async function down() {
  await this.connect(mongoose);
}
