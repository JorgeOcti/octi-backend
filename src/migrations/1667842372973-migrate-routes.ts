import * as mongoose from 'mongoose';
import { Car } from '../app/models';
import History from '../app/models/history.model';
import { StatusHistory, ModuleHistory } from '../app/models/history.types';
import { ICarLocation } from '../app/interfaces';
import InventoryCar from '../inventory/models/inventoryCar.model';
import Participant from '../form/models/participant.model';

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
  new Participant({});
  const duplicates: any [] = [];
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
    history.dups.forEach(function(dupId: any) {
        duplicates.push(dupId);
      }
    );
  }
  await History.remove({ _id: { $in: duplicates } });

  await History
    .find({
      // team: '5bf2de35caf8ef7096105cdd',
      module: {
        $in: [ModuleHistory.form, ModuleHistory.inventory]
      },
      status: {
        $in: [
          StatusHistory.available,
          StatusHistory.inTransit,
          StatusHistory.sale
        ]
      }
    })
    .populate([{
      path: 'participant',
      select: {
        _id: true,
        venue: true,
        shipping: true,
        sendTo: true,
        reception: true,
        receiveFrom: true,
        deliveryToCustomer: true
      }
    }, {
      path: 'inventoryCar',
      select: {
        venue: true,
        venueFound: true,
        inventory: true,
        inventoriedBy: true,
        car: true,
        status: true,
        createdAt: true,
        updatedAt: true
      }
    }])
    .cursor()
    .eachAsync(async (history) => {
      return new Promise(async (resolve, reject) => {
        try {
          if (history.module === ModuleHistory.form && history.participant) {
            const { participant } = history;
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
            await history.save();
            resolve({});
          } else if (history.module === ModuleHistory.inventory && history.inventoryCar) {
            const { inventoryCar } = history;
            const { venue, venueFound } = inventoryCar;
            history.from = venue;
            history.to = venueFound || venue;
            await history.save();
            resolve({});
          } else {
            await history.remove();
            console.log(`history._id: ${history._id} has no participant or inventoryCar`);
            resolve({});
          }
          resolve({});
        } catch (error) {
          console.log(error);
          return reject(error);
        }
      });
    }, { parallel: 1 });
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
          company: 1
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
          let currentLocation: Partial<ICarLocation> = {};
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
    }, { parallel: 1 });
}


// Make any changes that UNDO the up function side effects here (if possible)
export async function down() {
  await this.connect(mongoose);
}
