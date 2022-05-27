import { fromParticipantProps, importToSistemProps, InventoryCarProps } from './car.tracker.types';
import History from '../../models/history.model';
import { IHistory } from '../../interfaces/history.interface';
import { ModuleHistory, StatusHistory } from '../../models/history.types';
import logger from '../../../services/logger.service';
import InventoryCar, { ChoicesStatusCarInventory } from '../../../inventory/models/inventoryCar.model';
import { IInventory } from '../../../inventory/interfaces/inventory.interface';
import Participant from '../../../form/models/participant.model';
import { Car } from '../../models';

class CarTracker {

  constructor() {
    this.importIntoSystem = this.importIntoSystem.bind(this);
    this.fromParticipant = this.fromParticipant.bind(this);
    this.fromInventoryCar = this.fromInventoryCar.bind(this);
    this.updateCurrentHistory = this.updateCurrentHistory.bind(this);

    this.createHistory = this.createHistory.bind(this);
    this.updateAlerts = this.updateAlerts.bind(this);
  }

  public async fromInventoryCar({ id }: InventoryCarProps) {
    return new Promise(async (resolve, reject) => {
      try {
        logger.info(`CarTracker.fromInventoryCar`);
        const inventoryCar = await InventoryCar
          .findById(id, {
            venue: true,
            venueFound: true,
            inventory: true,
            inventoriedBy: true,
            car: true,
            status: true,
            createdAt: true,
            updatedAt: true
          })
          .populate([{
            path: 'inventory',
            select: {
              team: true,
              company: true
            }
          }]);
        // logger.info(`CarTracker.fromInventoryCar: inventoryCar: ${JSON.stringify(inventoryCar)}`);
        if (inventoryCar && inventoryCar.inventory && inventoryCar.inventoriedBy) {
          const { inventory, car, venue, venueFound, inventoriedBy, updatedAt, status } = inventoryCar;
          const { team, company } = inventory as unknown as IInventory;
          let history: Partial<IHistory> = {
            status: StatusHistory.available,
            module: ModuleHistory.inventory,
            car,
            inventory,
            inventoryCar,
            team,
            company,
            createdBy: inventoriedBy,
            executedAt: updatedAt
          };
          const statusDelegates: any = {
            [ChoicesStatusCarInventory.found]: StatusHistory.available,
            [ChoicesStatusCarInventory.reported]: StatusHistory.available
          };
          history['from'] = venue;
          history['to'] = venueFound || venue;
          history['status'] = statusDelegates[status as ChoicesStatusCarInventory];
          await this.createHistory(history);
          resolve({});
        }
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
        logger.info(`CarTracker.fromParticipant`);
        const participant = await Participant
          .findById(id, {
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
          })
          .populate([{
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
          }]);
        // logger.info(`CarTracker.fromParticipant: participant: ${JSON.stringify(participant)}`);
        if (participant) {
          const { car, team, company, venue, user, createdAt, hasDamages, sendTo, receiveFrom } = participant;
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
              from: receiveFrom,
              to: venue
            };
          } else if (participant.shipping) {
            history = {
              ...history,
              status: StatusHistory.inTransit,
              from: venue,
              to: sendTo
            };
          } else {
            history = {
              ...history,
              status: StatusHistory.available,
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
          // logger.info(`CarTracker.fromParticipant: history: ${JSON.stringify(history)}`);
          await this.createHistory(history);
          resolve({});
        }
      } catch (e) {
        /* istanbul ignore next */
        logger.error(e);
        reject(e);
      }
    });
  }

  public async importIntoSystem({ car, team, company, createdBy }: importToSistemProps) {
    return new Promise(async (resolve, reject) => {
      try {
        logger.info(`CarTracker.importToSistem`);
        let history: Partial<IHistory> = {
          status: StatusHistory.created,
          module: ModuleHistory.import,
          car,
          team,
          company,
          createdBy
        };
        // logger.info(`CarTracker.importToSistem: history: ${JSON.stringify(history)}`);
        await this.createHistory(history);
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
      logger.info(`CarTracker.createHistory`);
      // logger.info(`CarTracker.createHistory: history: ${JSON.stringify(history)}`);
      try {
        history = {
          ...history,
          current: true
        };
        // this.processAlert(history);
        await new History(history).save();
        this.updateCurrentHistory(history.car);
        resolve(history);
      } catch (e) {
        /* istanbul ignore next */
        logger.error(e);
        reject(e);
      }
    });
  }

  public async updateCurrentHistory(car: any) {
    return new Promise(async (resolve, reject) => {
      logger.info(`CarTracker.updateCurrentHistory`);
      try {
        const lastHistory = await History
          .findOne({
            car
          }, {
            _id: true
          }, {
            sort: {
              executedAt: -1
            }
          });
        if (lastHistory) {
          await History.updateMany({
            car: car
          }, {
            $set: { current: false }
          });
          await History.updateOne({
            _id: lastHistory._id
          }, {
            $set: { current: true }
          });
          await Car.updateOne({
            _id: car
          }, {
            $set: {
              event: lastHistory._id
            }
          });
        }
      } catch (e) {
        /* istanbul ignore next */
        logger.error(e);
        reject(e);
      }
    });
  }

  private async updateAlerts(history: Partial<IHistory>) {
    return new Promise(async (resolve, reject) => {
      logger.info(`CarTracker.updateCurrentHistory`);
      try {
        let lastHistory = await History.findOne({
          car: history.car
        }, {
          _id: true,
          alerts: true
        }, {
          sort: {
            executedAt: -1
          }
        });
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
      }
      catch (e) {
        /* istanbul ignore next */
        logger.error(e);
        reject(e);
      }
    });
  }

}

const carTracker = new CarTracker();
export default carTracker;
