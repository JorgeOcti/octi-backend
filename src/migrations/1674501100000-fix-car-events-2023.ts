import * as mongoose from 'mongoose';
import * as moment from 'moment';
import carTracker from '../app/controllers/tracker/car.tracker';
import { ICarLocation } from '../app/interfaces/car.interface';
import Car from '../app/models/car.model';
import History from '../app/models/history.model';
import Venue from '../app/models/venue.model';

mongoose.set('strictQuery', false);
mongoose.set('debug', false);

/*
 * Migration: fix-car-events-2023
 * npm exec migrate up fix-car-events-2023
 * npm exec migrate down fix-car-events-2023
 * */

// Make any changes you need to make to the database here
export async function up() {
  await this.connect(mongoose);
  const fixCarLocations = true;
  if (fixCarLocations) {
    console.log('Fixing car locations');
    const locationByID: any = {}
    const historiesToUpdate: any[] = [];
    const carsToUpdate: any[] = [];
    await Venue
      .find({
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
      .cursor({ batchSize: 100 });

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
            } else{
              historiesToUpdate.push({
                updateOne: {
                  filter: { _id: event._id },
                  update: {
                    $set: {
                      changeLocation: false
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
          // reject(error);
        }
      });
    }, { parallel: 100 });

    await History.bulkWrite(historiesToUpdate);
    await Car.bulkWrite(carsToUpdate);
    console.log('termino');
  }


  const carsCursor = Car.find(
    // { team: { $in: ['5bf2de35caf8ef7096105cdd', '5bf2de34caf8ef7096105cda'] } },
    {  },
    { _id: 1, history: 1 }
  ).cursor();
  await carsCursor.eachAsync(
    async (car: any) => {
      try {
        await carTracker.updateCurrentHistory(car);
      } catch (e) {
        console.log('Error updating car: ', car._id);
        console.log(e);
      }
    },
    { parallel: 100 }
  );
}

// Make any changes that UNDO the up function side effects here (if possible)
export async function down() {
  await this.connect(mongoose);
}
