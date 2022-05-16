import { deliveredToCustomerProps, importToSistemProps } from './car.tracker.types';
import History from '../../models/history.model';
import { IHistory } from '../../interfaces';
import { ModuleHistory, StatusHistory } from '../../models/history.types';
import logger from '../../../services/logger.service';

class CarTracker {

  constructor() {
    this.importIntoSistem = this.importIntoSistem.bind(this);
    this.fromRevision = this.fromRevision.bind(this);
    this.createHistory = this.createHistory.bind(this);
  }

  public async fromRevision({ from, participant, car, team, company, createdBy }: deliveredToCustomerProps) {
    try {
      logger.info(`CarTracker.deliveredToCustomer`);
      await this.createHistory({
        status: StatusHistory.sale,
        module: ModuleHistory.form,
        car,
        from,
        participant,
        team,
        company,
        createdBy
      });
    } catch (e) {
      /* istanbul ignore next */
      logger.error(e);
    }
  }

  public async importIntoSistem({ car, team, company, createdBy }: importToSistemProps) {
    try {
      logger.info(`CarTracker.importToSistem`);
      await this.createHistory({
        status: StatusHistory.created,
        module: ModuleHistory.import,
        car,
        team,
        company,
        createdBy
      });
    } catch (e) {
      /* istanbul ignore next */
      logger.error(e);
    }
  }

  private async createHistory(history: Partial<IHistory>) {
    return new Promise(async (resolve, reject) => {
      logger.info(`CarTracker.createHistory`);
      try {
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
