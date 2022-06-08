import { IRequest } from '../../interfaces/global.interface';
import { Response } from 'express';
import TransmittalItem from '../models/transmittalItem.model';
import TransmittalController from './transmittal.controller';
import logger from '../../services/logger.service';
import { io } from '../../server';
import Transmittal from '../models/transmittal.model';
import RequestItem from '../../request/models/requestItem.model';
import Car from '../../app/models/car.model';
import * as moment from '../../../public/theme/bower_components/moment/moment';

class TransmittalItemController {

  constructor() {
    this.index = this.index.bind(this);
    this.apiList = this.apiList.bind(this);
    this.apiDetail = this.apiDetail.bind(this);
    this.apiCreate = this.apiCreate.bind(this);
    this.apiDelete = this.apiDelete.bind(this);
    this.apiUpdate = this.apiUpdate.bind(this);
  }

  public async index(req: IRequest, res: Response) {
    res.render('app/index', { token: await req.user.generateToken() });
  }

  public async apiList(req: IRequest, res: Response) {
    res.json({
      api: 'TransmittalItemController:apiList'
    });
  }

  public async apiDetail(req: IRequest, res: Response) {
    res.json({
      api: 'TransmittalItemController:apiDetail'
    });
  }

  public async apiUpdate(req: IRequest, res: Response) {
    try {
      logger.info(`TransmittalItemController.apiUpdate`);
      const { id } = req.params;
      const { body: transmittalItem } = req;
      const { team } = req.user;
      if (transmittalItem.car) {
        const { car } = transmittalItem;
        await Car.findOneAndUpdate({ _id: car._id, team }, { $set: car });
      }
      const newTransmittalItem = await TransmittalItem
        .findOneAndUpdate({ _id: id }, { $set: transmittalItem }, { new: true })
        .populate(TransmittalController.itemPopulate);
      io.to(`transmittal-list-${team._id}`).emit('UPDATE_TRANSMITTAL_ITEM', {
        transmittalItem: newTransmittalItem
      });
      res.json({
        data: newTransmittalItem
      });
    } catch (e) {
      /* istanbul ignore next */
      logger.error(e);
      /* istanbul ignore next */
      logger.error(`TransmittalItemController.apiUpdate: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}`);
      res.status(500).json(e);
    }
  }

  public async apiCreate(req: IRequest, res: Response) {
    const { body: item, user } = req;
    const { team } = user;
    try {
      const transmittalItem = await new TransmittalItem({
        team,
        ...item,
        loadingDate: moment().toDate()
      }).save();
      const transmittalItemData = await TransmittalItem
        .findById(transmittalItem._id)
        .populate(TransmittalController.itemPopulate);
      // associate request item with transmittal and transmittal item
      if(item.requestItem){
        await RequestItem.findOneAndUpdate({
          _id: item.requestItem
        }, {
          assigned: true,
          transmittal: item.transmittal,
          transmittalItem: transmittalItem._id
        });
      }
      io.to(`transmittal-list-${team._id}`)
        .emit('CREATE_TRANSMITTAL_ITEM', {
          transmittalItem: transmittalItemData
        });
      res.json({
        data: transmittalItemData
      });
    } catch (e) {
      /* istanbul ignore next */
      logger.error(e);
      /* istanbul ignore next */
      logger.error(`TransmittalItemController.apiCreate: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}`);
      res.status(500).json(e);
    }
  }

  public async apiDelete(req: IRequest, res: Response) {
    logger.info(`TransmittalItemController.apiDelete`);
    const { id } = req.params;
    const { team } = req.user;
    try {
      const transmittalItem = await TransmittalItem.findOne({ _id: id });
      if (transmittalItem) {
        await transmittalItem.remove();
        const transmittalItems = await TransmittalItem.find({ transmittal: transmittalItem.transmittal }).countDocuments();
        io.to(`transmittal-list-${team._id}`).emit('DELETE_TRANSMITTAL_ITEM', {
          transmittalItem
        });
        // clear assigned request item
        await RequestItem.findOneAndUpdate({
          _id: transmittalItem.requestItem
        }, {
          assigned: false,
          transmittal: null,
          transmittalItem: null
        });
        // clean transmittal
        if (transmittalItems === 0) {
          const transmittal = await Transmittal.findOne({ _id: transmittalItem.transmittal });
          await transmittal!.remove();
          io.to(`transmittal-list-${team._id}`).emit('DELETE_TRANSMITTAL', {
            transmittal
          });
        }

      }
      res.json({
        transmittalItem
      });
    } catch (e) {
      /* istanbul ignore next */
      logger.error(e);
      /* istanbul ignore next */
      logger.error(`TransmittalItemController.apiDelete: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}`);
      res.status(500).json(e);
    }
  }
}

export default new TransmittalItemController();
