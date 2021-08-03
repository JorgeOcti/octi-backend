import {IRequest} from "../../interfaces/global.interface";
import {Response} from "express";
import TransmittalItem from "../models/transmittalItem.model";
import TransmittalController from "./transmittal.controller";
import logger from "../../services/logger.service";
import {io} from "../../server";

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
    res.render('app/index', {token: await req.user.generateToken()});
  }

  public async apiList(req: IRequest, res: Response) {
    res.json({
      api: 'apiList:apiDetail'
    })
  }

  public async apiDetail(req: IRequest, res: Response) {
    res.json({
      api: 'TransmittalItemController:apiDetail'
    })
  }

  public async apiUpdate(req: IRequest, res: Response) {
    logger.info(`TransmittalItemController.apiUpdate`);
    const {id} = req.params;
    const {body: transmittalItem} = req;
    const {team} = req.user;
    try {
      const newTransmittalItem = await TransmittalItem
        .findOneAndUpdate({_id: id}, {$set: transmittalItem}, {new: true})
        .populate(TransmittalController.itemPopulate);
      io.to(`transmittal-list-${team._id}`).emit('UPDATE_TRANSMITTAL_ITEM', {
        transmittalItem: newTransmittalItem
      });
      res.json({
        data: newTransmittalItem,
      });
    } catch (e) {
      /* istanbul ignore next */
      logger.error(e);
      /* istanbul ignore next */
      logger.error(`TransmittalItemController.apiUpdate: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
      res.status(500).json(e);
    }
  }

  public async apiCreate(req: IRequest, res: Response) {
    res.json({
      api: 'TransmittalItemController:apiCreate'
    })
  }

  public async apiDelete(req: IRequest, res: Response) {
    logger.info(`TransmittalItemController.apiDelete`);
    const {id} = req.params;
    const {team} = req.user;
    try {
      const transmittalItem = await TransmittalItem.findOne({_id: id});
      if(transmittalItem){
        await transmittalItem.remove();
        io.to(`transmittal-list-${team._id}`).emit('DELETE_TRANSMITTAL_ITEM', {
          transmittalItem
        });
      }
      res.json({
        transmittalItem
      })
    } catch (e) {
      /* istanbul ignore next */
      logger.error(e);
      /* istanbul ignore next */
      logger.error(`TransmittalItemController.apiDelete: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
      res.status(500).json(e);
    }
  }
}

export default new TransmittalItemController();
