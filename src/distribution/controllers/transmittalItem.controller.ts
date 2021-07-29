import {IRequest} from "../../interfaces/global.interface";
import {Response} from "express";
import TransmittalItem from "../models/transmittalItem.model";
import logger from "../../services/logger.service";

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
     const { body: transmittalItem } = req;
    try {
      const newTransmittalItem = await TransmittalItem.findOneAndUpdate({_id: id}, {$set: transmittalItem}, {new: true});
      res.json({
        transmittalItem,
        newTransmittalItem,
        api: 'TransmittalItemController:apiUpdate'
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
    res.json({
      api: 'TransmittalItemController:apiDelete'
    })
  }
}

export default new TransmittalItemController();
