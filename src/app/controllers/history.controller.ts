import { IRequest } from '../../interfaces/global.interface';
import { Response } from 'express';
import logger from '../../services/logger.service';
import * as mongoose from 'mongoose'
import { Car } from '../models';

class HistoryController {

  constructor() {
    this.searchCar = this.searchCar.bind(this);
  }

  public async searchCar(req: IRequest, res: Response) {
    logger.info(`HistoryController.searchCar`);
    logger.info(`HistoryController {user: {_id: ${req.user._id}, email: ${req.user.email}}} {params: ${JSON.stringify(req.params)}`);
    const { team } = req.user;
    const { vin } = req.params;
    try {
      const historySelect: any = {
        from: true,
        to: true,
        executedAt: true,
        current: true,
        module: true,
        status: true
      };
      const historyPopulate: any = [{
        path: 'from',
        select: { name: true }
      }, {
        path: 'to',
        select: { name: true }
      }, {
        path: 'createdBy',
        select: { email: true }
      }];
      mongoose.set('debug', true);
      const car = await Car.findOne({
        vin,
        team
      }, {
        vin: true,
        internalNumber: true,
        vin2: true,
        brand: true,
        denomination: true,
        color: true,
        property: true,
        type: true,
        material: true
      }).populate([{
        path: 'events',
        select: historySelect,
        populate: historyPopulate,
        options: {
          sort: {
            executedAt: -1
          }
        }
      }]);
      mongoose.set('debug', false);
      if (car) {
        let response = {
          ...car.toObject()
        };
        if (car.events.length) {
          response = {
            ...response,
            event: car.events[0]
          };
        }
        res.json(response);
      }
    } catch (e) {
      /* istanbul ignore next */
      logger.error(`HistoryController.searchCar: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
      res.status(500).json(e);
    }
  }
}

const historyController = new HistoryController();
export default historyController;
