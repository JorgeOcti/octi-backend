import * as moment from 'moment';
import * as mongoose from 'mongoose';
import type { ICarLocation } from '../app/interfaces/car.interface';
import { Car } from '../app/models/car.model';
import History from '../app/models/history.model';
import { ModuleHistory } from '../app/models/history.types';
import { Venue } from '../app/models/venue.model';
import Participant from '../form/models/participant.model';
import InventoryCar from '../inventory/models/inventoryCar.model';

mongoose.set('strictQuery', false);
mongoose.set('debug', false);

/*
* Migration: migrate-routes
* npm exec migrate up migrate-routes
* npm exec migrate down migrate-routes
* */

// Make any changes you need to make to the database here
export async function up() {
  await this.connect(mongoose);
  new InventoryCar({});
  new Car({});
  new Participant({});
  const fixDuplicates = false;
  const fixHistoryLocations = false;
  const fixCarLocations = true;

  if (fixDuplicates) {
    console.log('Fixing duplicates');
    const duplicates: any[] = [];
    const historiesDuplicates = await History.aggregate([
      {
        '$match': {
          'module': 'inventory'
        }
      }, {
        '$group': {
          '_id': {
            'inventory': '$inventory',
            'car': '$car',
            'status': '$status'
          },
          'dups': {
            '$addToSet': '$_id'
          },
          'count': {
            '$sum': 1
          }
        }
      }, {
        '$match': {
          'count': {
            '$gt': 1
          }
        }
      }
    ]);

    for (const history of historiesDuplicates) {
      history.dups.shift();
      history.dups.forEach(function (dupId: any) {
        duplicates.push(dupId);
      }
      );
    }
    await History.remove({ _id: { $in: duplicates } });
  }

  if (fixHistoryLocations) {
    console.log('Fixing history locations');

    const historiesCursor = History
      .aggregate([
        {
          '$match': {
            'module': {
              '$in': [
                'form', 'inventory'
              ]
            },
            'status': {
              '$in': [
                'available', 'inTransit', 'sale'
              ]
            }
          }
        }, {
          '$lookup': {
            'from': 'inventorycars',
            'localField': 'inventoryCar',
            'foreignField': '_id',
            'as': 'inventoryCar'
          }
        }, {
          '$unwind': {
            'path': '$inventoryCar',
            'preserveNullAndEmptyArrays': true
          }
        }, {
          '$lookup': {
            'from': 'participants',
            'localField': 'participant',
            'foreignField': '_id',
            'as': 'participant'
          }
        }, {
          '$unwind': {
            'path': '$participant',
            'preserveNullAndEmptyArrays': true
          }
        }, {
          '$project': {
            'module': 1,
            'from': 1,
            'to': 1,
            'participant._id': 1,
            'participant.venue': 1,
            'participant.shipping': 1,
            'participant.sendTo': 1,
            'participant.reception': 1,
            'participant.receiveFrom': 1,
            'participant.deliveryToCustomer': 1,
            'inventoryCar._id': 1,
            'inventoryCar.venue': 1,
            'inventoryCar.venueFound': 1
          }
        }
      ])
      .allowDiskUse(true)
      .cursor()

    const updates: any[] = [];
    await historiesCursor.eachAsync(async (history: any) => {
      return new Promise((resolve, reject) => {
        console.log(updates.length);
        const { module, participant, inventoryCar } = history;
        try {
          if (module === ModuleHistory.form && participant) {
            const { venue, shipping, sendTo, reception, receiveFrom, deliveryToCustomer } = participant;
            if (deliveryToCustomer) {
              history.from = venue;
              history.to = venue;
            } else if (reception && receiveFrom) {
              history.from = receiveFrom;
              history.to = venue;
            } else if (shipping && sendTo) {
              history.from = venue;
              history.to = sendTo;
            } else {
              history.from = venue;
              history.to = venue;
            }
            updates.push({
              updateOne: {
                filter: { _id: history._id },
                update: { $set: { from: history.from, to: history.to } }
              }
            });
            // await history.save();
            resolve({});
          } else if (history.module === ModuleHistory.inventory && history.inventoryCar) {
            const { venue, venueFound } = inventoryCar;
            history.from = venue;
            history.to = venueFound || venue;
            updates.push({
              updateOne: {
                filter: { _id: history._id },
                update: { $set: { from: history.from, to: history.to } }
              }
            });
            // await history.save();
            resolve({});
          } else {
            updates.push({
              deleteOne: {
                filter: { _id: history._id },
              }
            });
            // await history.remove();
            console.log(`history._id: ${history._id} has no participant or inventoryCar`);
            resolve({});
          }
          resolve({});
        } catch (error) {
          console.log(error);
          return reject(error);
        }
      });
    });
    await History.bulkWrite(updates);
    console.log('termino');

    // await History
    //   .find({
    //     // team: '5bf2de35caf8ef7096105cdd',
    //     module: {
    //       $in: [ModuleHistory.form, ModuleHistory.inventory]
    //     },
    //     status: {
    //       $in: [
    //         StatusHistory.available,
    //         StatusHistory.inTransit,
    //         StatusHistory.sale
    //       ]
    //     }
    //   }, {
    //     module: 1,
    //     participant: 1,
    //     inventoryCar: 1,
    //     from: 1,
    //     to: 1
    //   }, {
    //     allowDiskUse: true
    //   })
    //   .populate([{
    //     path: 'participant',
    //     select: {
    //       _id: true,
    //       venue: true,
    //       shipping: true,
    //       sendTo: true,
    //       reception: true,
    //       receiveFrom: true,
    //       deliveryToCustomer: true
    //     }
    //   }, {
    //     path: 'inventoryCar',
    //     select: {
    //       venue: true,
    //       venueFound: true,
    //       inventory: true,
    //       inventoriedBy: true,
    //       car: true,
    //       status: true,
    //       createdAt: true,
    //       updatedAt: true
    //     }
    //   }])
    //   .cursor()
    //   .eachAsync(async (history) => {
    //     return new Promise(async (resolve, reject) => {
    //       const { module, participant, inventoryCar } = history;
    //       console.log(history._id);
    //       try {
    //         if (module === ModuleHistory.form && participant) {
    //           const { venue, shipping, sendTo, reception, receiveFrom, deliveryToCustomer } = participant;
    //           if (deliveryToCustomer) {
    //             history.from = venue;
    //             history.to = venue;
    //           } else if (reception && receiveFrom) {
    //             history.from = receiveFrom;
    //             history.to = venue;
    //           } else if (shipping && sendTo) {
    //             history.from = venue;
    //             history.to = sendTo;
    //           } else {
    //             history.from = venue;
    //             history.to = venue;
    //           }
    //           await history.save();
    //           resolve({});
    //         } else if (history.module === ModuleHistory.inventory && history.inventoryCar) {
    //           const { venue, venueFound } = inventoryCar;
    //           history.from = venue;
    //           history.to = venueFound || venue;
    //           await history.save();
    //           resolve({});
    //         } else {
    //           await history.remove();
    //           console.log(`history._id: ${history._id} has no participant or inventoryCar`);
    //           resolve({});
    //         }
    //         resolve({});
    //       } catch (error) {
    //         console.log(error);
    //         return reject(error);
    //       }
    //     });
    //   }, { parallel: 100 });
  }

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
      .cursor();

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

    // await Car
    //   .find({
    //     event: { $exists: true }
    //     // team: '5bf2de35caf8ef7096105cdd'
    //   }, {
    //     _id: 1,
    //     events: 1
    //   }, {
    //     allowDiskUse: true
    //   })
    //   .populate([{
    //     path: 'events',
    //     match: {
    //       status: {
    //         $in: [
    //           StatusHistory.available,
    //           StatusHistory.inTransit,
    //           StatusHistory.sale
    //         ]
    //       }
    //     },
    //     populate: [{
    //       path: 'to',
    //       select: {
    //         name: 1,
    //         team: 1,
    //         company: 1
    //       }
    //     }],
    //     options: {
    //       sort: {
    //         executedAt: 1
    //       }
    //     }
    //   }])
    //   .cursor()
    //   .eachAsync(async (car) => {
    //     return new Promise(async (resolve, reject) => {
    //       try {
    //         let currentLocation: Partial<ICarLocation> = {};
    //         const { events } = car;
    //         for (const event of events) {
    //           if (event?.to?._id && currentLocation?.venue?._id !== event.to._id) {
    //             currentLocation = {
    //               venue: event.to,
    //               checkedDate: event.executedAt
    //             };
    //             await History
    //               .updateOne({
    //                 _id: event._id
    //               }, {
    //                 $set: {
    //                   changeLocation: true
    //                 }
    //               });
    //           }
    //         }
    //         if (currentLocation) {
    //           car.meta = {
    //             location: currentLocation
    //           };
    //           await car.save();
    //         }
    //         return resolve({});
    //       } catch (error) {
    //         console.log(error);
    //         return reject(error);
    //       }
    //     });
    //   }, { parallel: 100 });
  }

}

// Make any changes that UNDO the up function side effects here (if possible)
export async function down() {
  await this.connect(mongoose);
}
