import { fromParticipantProps, importToSistemProps, InventoryCarProps } from './car.tracker.types';
import History from '../../models/history.model';
import { IHistory } from '../../interfaces/history.interface';
import { ModuleHistory, StatusHistory } from '../../models/history.types';
import logger from '../../../services/logger.service';
import InventoryCar, { ChoicesStatusCarInventory } from '../../../inventory/models/inventoryCar.model';
import { IInventory } from '../../../inventory/interfaces/inventory.interface';
import Participant from '../../../form/models/participant.model';

class CarTracker {

  constructor() {
    this.importIntoSistem = this.importIntoSistem.bind(this);
    this.fromParticipant = this.fromParticipant.bind(this);
    this.fromInventoryCar = this.fromInventoryCar.bind(this);
    this.createHistory = this.createHistory.bind(this);
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
        console.log(`CarTracker.fromInventoryCar: inventoryCar: ${JSON.stringify(inventoryCar)}`);
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
          const executeHistory = [
            ChoicesStatusCarInventory.found,
            ChoicesStatusCarInventory.reported
            // ChoicesStatusCarInventory.leftover
          ].includes(status as ChoicesStatusCarInventory);
          if (executeHistory) {
            const statusDelegates: any = {
              [ChoicesStatusCarInventory.found]: StatusHistory.available,
              [ChoicesStatusCarInventory.reported]: StatusHistory.available
            };
            history['from'] = venue;
            history['to'] = venueFound || venue;
            history['status'] = statusDelegates[status as ChoicesStatusCarInventory];
            await this.createHistory(history);
          }
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
            createdAt: true
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
        console.log(`CarTracker.fromParticipant: participant: ${JSON.stringify(participant)}`);
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
            history['status'] = StatusHistory.sale;
            history['from'] = venue;
            history['to'] = venue;
          } else if (participant.reception) {
            history['status'] = StatusHistory.available;
            history['from'] = receiveFrom;
            history['to'] = venue;
          } else if (participant.shipping) {
            history['status'] = StatusHistory.inTransit;
            history['from'] = venue;
            history['to'] = sendTo;
          }
          if (hasDamages) {
            history['alert'] = {
              hasDamages
            };
          }
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

  public async importIntoSistem({ car, team, company, createdBy }: importToSistemProps) {
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
        console.log(`CarTracker.importToSistem: history: ${JSON.stringify(history)}`);
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
      console.log(`CarTracker.createHistory: history: ${JSON.stringify(history)}`);
      try {
        const lastHistory = await History.findOne({
          car: history.car
        }, {}, { sort: { 'executedAt': -1 } });
        if (lastHistory && history?.alert?.hasDamages) {
          history['alerts'] = [history.alert, ...lastHistory.alerts];
        } else if (lastHistory && !history?.alert?.hasDamages) {
          history['alerts'] = lastHistory.alerts;
        } else if (history?.alert?.hasDamages) {
          history['alerts'] = [history.alert];
        } else {
          history['alerts'] = [];
        }
        await History.updateMany({
          car: history.car,
          current: true
        }, {
          $set: { current: false }
        });
        const data = await new History({
          ...history,
          current: true
        }).save();
        resolve(data);
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
