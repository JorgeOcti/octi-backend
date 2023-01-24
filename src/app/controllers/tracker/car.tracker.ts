import * as moment from 'moment-timezone';
import Participant from '../../../form/models/participant.model';
import { IStringKeyObject } from '../../../interfaces/global.interface';
import { IInventory } from '../../../inventory/interfaces/inventory.interface';
import InventoryCar, {
  ChoicesStatusCarInventory
} from '../../../inventory/models/inventoryCar.model';
import logger from '../../../services/logger.service';
import type { ICar } from '../../interfaces/car.interface';
import type { IHistory } from '../../interfaces/history.interface';
import { Car } from '../../models/car.model';
import History from '../../models/history.model';
import { ModuleHistory, StatusHistory } from '../../models/history.types';
import { Venue } from '../../models/venue.model';
import {
  fromParticipantProps,
  importToSistemProps,
  InventoryCarProps
} from './car.tracker.types';

class CarTracker {
  constructor() {
    this.importIntoSystem = this.importIntoSystem.bind(this);
    this.fromParticipant = this.fromParticipant.bind(this);
    this.fromInventoryCar = this.fromInventoryCar.bind(this);
    this.updateCurrentHistory = this.updateCurrentHistory.bind(this);

    this.createHistory = this.createHistory.bind(this);
    this.updateAlerts = this.updateAlerts.bind(this);
    this.createImportHitory = this.createImportHitory.bind(this);
  }

  public async fromInventoryCar({ id }: InventoryCarProps) {
    return new Promise(async (resolve, reject) => {
      try {
        const inventoryCar = await InventoryCar.findById(id, {
          venue: true,
          venueFound: true,
          inventory: true,
          inventoriedBy: true,
          car: true,
          status: true,
          createdAt: true,
          updatedAt: true
        }).populate([
          {
            path: 'inventory',
            select: {
              team: true,
              company: true
            }
          },{
            path: 'car',
            select: {
              _id: true,
            }
          }
        ]);
        // logger.info(`CarTracker.fromInventoryCar: inventoryCar: ${JSON.stringify(inventoryCar)}`);

        if (
          inventoryCar &&
          inventoryCar.inventory &&
          ![
            ChoicesStatusCarInventory.pending,
            ChoicesStatusCarInventory.missing,
            ChoicesStatusCarInventory.deleted
          ].includes(inventoryCar.status as any)
        ) {
          const {
            inventory,
            car,
            venue,
            venueFound,
            inventoriedBy,
            labelBy,
            updatedAt,
            status
          } = inventoryCar;
          const { team, company } = inventory as unknown as IInventory;
          let history: Partial<IHistory> = {
            status: StatusHistory.available,
            module: ModuleHistory.inventory,
            car,
            inventory,
            inventoryCar,
            team,
            company,
            createdBy: inventoriedBy || labelBy,
            executedAt: updatedAt
          };
          const statusDelegate: IStringKeyObject<StatusHistory> = {
            [ChoicesStatusCarInventory.found]: StatusHistory.available,
            [ChoicesStatusCarInventory.pending]: StatusHistory.unknown,
            [ChoicesStatusCarInventory.missing]: StatusHistory.unknown,
            [ChoicesStatusCarInventory.deleted]: StatusHistory.unknown,
            [ChoicesStatusCarInventory.leftover]: StatusHistory.available,
            [ChoicesStatusCarInventory.reported]: StatusHistory.available
          };
          history['from'] = venue;
          history['to'] = venueFound || venue;
          history['status'] = statusDelegate[status];
          logger.info(
            `CarTracker.fromInventoryCar ${JSON.stringify(
              inventory
            )} history: ${JSON.stringify(history)}`
          );
          logger.debug(
            `CarTracker.fromInventoryCar ${JSON.stringify(
              inventory
            )} inventoryCar: ${JSON.stringify(inventoryCar)} }`
          );
          await this.createHistory(history);
        }
        resolve({});
      } catch (e) {
        /* istanbul ignore next */
        logger.error(e);
        reject(e);
      }
    });
  }

  public async fromParticipant({ id }: fromParticipantProps) {
    return new Promise(async (resolve, reject) => {
      try {
        const participant = await Participant.findById(id, {
          _id: true,
          car: true,
          team: true,
          company: true,
          venue: true,
          user: true,
          hasDamages: true,
          createdAt: true,
          deliveryToCustomer: true,
          reception: true,
          receptionVenue: true,
          shipping: true,
          shippingVenue: true,
          sendTo: true,
          receiveFrom: true
        }).populate([
          {
            path: 'form',
            select: {
              deliveryToCustomer: true,
              reception: true,
              receptionVenue: true,
              shipping: true,
              shippingVenue: true,
              sendTo: true,
              receiveFrom: true
            }
          },{
            path: 'car',
            select: {
              _id: true,
            }
          }
        ]);
        // logger.info(`CarTracker.fromParticipant: participant: ${JSON.stringify(participant)}`);
        if (participant && participant.car) {
          const {
            car,
            team,
            company,
            venue,
            user,
            createdAt,
            hasDamages,
            sendTo,
            receiveFrom
          } = participant;
          let history: Partial<IHistory> = {
            status: StatusHistory.available,
            module: ModuleHistory.form,
            car,
            participant,
            team,
            company,
            executedAt: createdAt,
            createdBy: user
          };
          if (participant.deliveryToCustomer) {
            history = {
              ...history,
              status: StatusHistory.sale,
              from: venue,
              to: venue
            };
          } else if (participant.reception) {
            history = {
              ...history,
              status: StatusHistory.available,
              from: receiveFrom || venue,
              to: venue
            };
          } else if (participant.shipping) {
            history = {
              ...history,
              status: StatusHistory.inTransit,
              from: venue,
              to: sendTo || venue
            };
          } else {
            history = {
              ...history,
              status: StatusHistory.unknown,
              from: venue,
              to: venue
            };
          }
          if (hasDamages) {
            history = {
              ...history,
              alert: {
                hasDamages
              }
            };
          }
          logger.info(
            `CarTracker.fromParticipant participant: ${
              participant._id
            } history: ${JSON.stringify(history)}`
          );
          await this.createHistory(history);
        }
        resolve({});
      } catch (e) {
        /* istanbul ignore next */
        logger.error(e);
        reject(e);
      }
    });
  }

  public async importIntoSystem({
    car,
    team,
    company,
    createdBy,
    module,
    executedAt
  }: importToSistemProps) {
    return new Promise(async (resolve, reject) => {
      try {
        let history: Partial<IHistory> = {
          status: StatusHistory.created,
          module: module ?? ModuleHistory.import,
          car,
          team,
          company,
          createdBy,
          executedAt: executedAt
        };
        logger.info(
          `CarTracker.importIntoSystem history: ${JSON.stringify(history)}`
        );
        if (executedAt) {
          await this.createHistory(history);
        }
        resolve({});
      } catch (e) {
        /* istanbul ignore next */
        logger.error(e);
        reject(e);
      }
    });
  }

  public async createImportHitory(car: ICar) {
    return new Promise(async (resolve, reject) => {
      try {
        logger.info(`CarTracker.createImportHitory ${JSON.stringify(car)}`);
        const firstHistory = await History.findOne(
          {
            car: car._id,
            status: {
              $nin: [StatusHistory.created]
            }
          },
          {
            _id: true,
            executedAt: true,
            module: true,
            team: true,
            company: true,
            createdBy: true
          },
          {
            sort: {
              executedAt: 1
            }
          }
        );
        const createdHistory = await History.findOne(
          {
            car: car._id,
            status: {
              $in: [StatusHistory.created]
            }
          },
          {
            _id: true,
            executedAt: true
          }
        );
        if (createdHistory) {
          logger.info(`CarTracker: no created history for ${car._id}`);
        } else {
          if (
            firstHistory &&
            moment(firstHistory.executedAt).isSame(car.createdAt, 'hour')
          ) {
            await this.importIntoSystem({
              car: car._id,
              team: firstHistory.team,
              company: firstHistory.company,
              createdBy: firstHistory.createdBy,
              executedAt: firstHistory.executedAt,
              module: firstHistory.module
            });
          } else {
            await this.importIntoSystem({
              car: car._id,
              team: car.team,
              company: car.company,
              createdBy: car.createdBy,
              executedAt: car.createdAt
            });
          }
        }
        resolve({});
      } catch (e) {
        /* istanbul ignore next */
        logger.error(e);
        reject(e);
      }
    });
  }

  public async updateCurrentHistory(car: ICar) {
    return new Promise(async (resolve, reject) => {
      try {
        logger.debug(`CarTracker.updateCurrentHistory ${JSON.stringify(car)}`);
        const lastHistory = await History.findOne(
          {
            car: car._id
          },
          {
            _id: true,
            to: true,
            executedAt: true
          },
          {
            sort: {
              executedAt: -1
            }
          }
        );
        if (lastHistory) {
          await History.updateMany(
            {
              car: car._id
            },
            {
              $set: { current: false }
            }
          );
          await History.updateOne(
            {
              _id: lastHistory._id
            },
            {
              $set: {
                current: true
              }
            }
          );
          await Car.updateOne(
            {
              _id: car._id
            },
            {
              $set: {
                event: lastHistory._id,
                'meta.location': {
                  venue: await Venue.findOne(
                    { _id: lastHistory.to },
                    { name: 1, team: 1, company: 1 }
                  ),
                  checkedDate: lastHistory.executedAt
                }
              }
            }
          );
        }
        resolve({});
      } catch (e) {
        /* istanbul ignore next */
        logger.error(e);
        reject(e);
      }
    });
  }

  private async createHistory(history: Partial<IHistory>) {
    return new Promise(async (resolve, reject) => {
      try {
        history = {
          ...history,
          current: true
        };
        // this.processAlert(history);
        logger.debug(
          `CarTracker.createHistory history: ${JSON.stringify(history)}`
        );
        const currentLocation = await History.findOne({
          changeLocation: true
        }).sort({ executedAt: -1 });
        if (history?.to && currentLocation?.to !== history.to) {
          history = {
            ...history,
            changeLocation: true
          };
          await Car.updateOne(
            {
              car: history.car._id
            },
            {
              $set: {
                'meta.location': {
                  venue: await Venue.findOne(
                    { _id: history.to },
                    { name: 1, team: 1, company: 1 }
                  ),
                  checkedDate: history.executedAt
                }
              }
            }
          );
        }
        await new History(history).save();
        // disable if create new database
        await this.updateCurrentHistory(history.car);
        resolve(history);
      } catch (e) {
        /* istanbul ignore next */
        logger.info(`CarTracker.createHistory: ${JSON.stringify(history)}`);
        logger.error(e);
        reject(e);
      }
    });
  }

  private async updateAlerts(history: Partial<IHistory>) {
    return new Promise(async (resolve, reject) => {
      logger.debug(
        `CarTracker.updateAlerts history: ${JSON.stringify(history)}`
      );
      try {
        let lastHistory = await History.findOne(
          {
            car: history.car
          },
          {
            _id: true,
            alerts: true
          },
          {
            sort: {
              executedAt: -1
            }
          }
        );
        if (lastHistory && history?.alert?.hasDamages) {
          history = {
            ...history,
            alerts: [history.alert, ...lastHistory.alerts]
          };
        } else if (lastHistory && !history?.alert?.hasDamages) {
          history = {
            ...history,
            alerts: lastHistory.alerts
          };
        } else if (history?.alert?.hasDamages) {
          history = {
            ...history,
            alerts: [history.alert]
          };
        } else {
          history = {
            ...history,
            alerts: []
          };
        }
        resolve(history);
      } catch (e) {
        /* istanbul ignore next */
        logger.error(e);
        reject(e);
      }
    });
  }
}

const carTracker = new CarTracker();
export default carTracker;
