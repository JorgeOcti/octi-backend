import { Response } from 'express';
import type { IRequest } from '../../interfaces/global.interface';
import logger from '../../services/logger.service';
import { Car } from '../models/car.model';
import History from '../models/history.model';

class HistoryController {

  readonly models: any;

  constructor() {
    this.models = {
      history: new History()
    };
    this.searchCar = this.searchCar.bind(this);
  }

  public async searchCar(req: IRequest, res: Response) {
    logger.info(`HistoryController.searchCar`);
    const { params } = req;
    logger.info(`HistoryController.searchCar {user: {_id: ${req.user._id}, email: ${req.user.email}} {params: ${JSON.stringify(params ?? {})}`);
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
      /*const car = await Car.aggregate([{
        $match: {
          vin,
          team: team._id
        }
      }, {
        $lookup: {
          from: 'histories',
          localField: '_id',
          foreignField: 'car',
          as: 'events'
        }
      }, {
        $lookup: {
          from: 'histories',
          localField: 'event',
          foreignField: '_id',
          as: 'data'
        }
      }, {
        $unwind: { path: '$data', preserveNullAndEmptyArrays: true }
      },{
        $project: {
          '_id': true,
          vin: true,
          internalNumber: true,
          vin2: true,
          brand: true,
          denomination: true,
          color: true,
          property: true,
          type: true,
          material: true,
          event: true
        }
      }]);*/
      const car = await Car.findOne({
        vin,
        team: team._id
      }, {
        vin: true,
        internalNumber: true,
        vin2: true,
        brand: true,
        denomination: true,
        color: true,
        property: true,
        type: true,
        material: true,
        event: true
      }).populate([{
        path: 'data',
        select: historySelect,
        populate: historyPopulate
      }, {
        path: 'events',
        select: historySelect,
        populate: historyPopulate,
        options: {
          sort: {
            executedAt: -1
          }
        }
      }]);
      if (car) {
        // logger.info(`HistoryController.searchCar {car: ${JSON.stringify(car ?? {})}`);
        return res.json(car);
      } else {
        return res.status(404).json({
          message: 'Not found',
          status: 404
        });
      }
    } catch (e) {
      /* istanbul ignore next */
      logger.error(`HistoryController.searchCar: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}`);
      return res.status(500).json(e);
    }
  }
}

const historyController = new HistoryController();
export default historyController;
