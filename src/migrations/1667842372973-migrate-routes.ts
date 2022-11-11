import * as mongoose from 'mongoose';
import { Car } from '../app/models';
import History from '../app/models/history.model';
import { StatusHistory } from '../app/models/history.types';
import { ICarLocation } from '../app/interfaces';

mongoose.set('strictQuery', false);
mongoose.set('debug', true);

/*
* Migration: migrate-routes
* npm exec migrate up migrate-routes
* npm exec migrate down migrate-routes
* */

// Make any changes you need to make to the database here
export async function up() {
  await this.connect(mongoose);
  /*await History
    .find({
      team: '5bf2de35caf8ef7096105cdd'
    })
    .cursor()
    .eachAsync(async (history) => {
      return new Promise(async (resolve, reject) => {

      });
    });*/
  await Car
    .find({
      event: { $exists: true },
      // team: '5bf2de35caf8ef7096105cdd'
    })
    .populate([{
      path: 'events',
      match: {
        status: {
          $in: [
            StatusHistory.available,
            StatusHistory.inTransit,
            StatusHistory.sale
          ]
        }
      },
      populate: [{
        path: 'to',
        select: {
          name: 1,
          team: 1,
          company: 1,
        }
      }],
      options: {
        sort: {
          executedAt: 1
        }
      }
    }])
    .cursor()
    .eachAsync(async (car) => {
      return new Promise(async (resolve, reject) => {
        try {
          let currentLocation: Partial<ICarLocation> = { };
          for (const event of car.events) {
            if (event?.to?._id && currentLocation?.venue?._id !== event.to._id) {
              currentLocation = {
                venue: event.to,
                checkedDate: event.executedAt
              };
              await History
                .updateOne({
                  _id: event._id
                }, {
                  $set: {
                    changeLocation: true
                  }
                });
            }
          }
          if (currentLocation) {
            car.meta = {
              location: currentLocation
            };
            await car.save();
          }
          return resolve({});
        } catch (error) {
          console.log(error);
          return reject(error);
        }
      });
    },{ parallel: 2 });
}

// Make any changes that UNDO the up function side effects here (if possible)
export async function down() {
  await this.connect(mongoose);
}
