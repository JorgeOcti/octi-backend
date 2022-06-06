import { Response } from 'express';
import { PaginateOptions, PaginateResult } from 'mongoose';
import { IRequest } from '../../interfaces/global.interface';
import { io } from '../../server';
import logger from '../../services/logger.service';
import Request from '../models/request.model';
import SalesChannel, { ISalesChannelModel } from '../models/salesChannel.model';

class SalesChannelController {

  constructor() {
    this.apiList = this.apiList.bind(this);
    this.apiCreate = this.apiCreate.bind(this);
    this.apiUpdate = this.apiUpdate.bind(this);
    this.apiDelete = this.apiDelete.bind(this);
    this.getChannels = this.getChannels.bind(this);
    this.createDefault = this.createDefault.bind(this);
    this.updateFleet = this.updateFleet.bind(this);
  }

  public async apiCreate(req: IRequest, res: Response) {
    const { team } = req.user;
    const object = req.body;
    try {
      logger.info(`SalesChannelController.apiCreate email: ${req.user.email}, body: ${JSON.stringify(req.body)}`);
      const reason = await new SalesChannel({ ...object, team }).save();
      io.to(`request-status-list-${team._id}`).emit('REFRESH', {
        update: true
      });
      res.status(200).json({
        ...reason
      });
    } catch (e) {
      /* istanbul ignore next */
      logger.error(`SalesChannelController.apiCreate: Async Error. email: ${req.user.email}`);
      /* istanbul ignore next */
      res.status(500).json(e);
    }
  }

  public async apiUpdate(req: IRequest, res: Response) {
    const { team } = req.user;
    const { id } = req.params;
    const update = req.body;
    try {
      logger.info(`SalesChannelController.apiUpdate email: ${req.user.email}, body: ${JSON.stringify(req.body)}`);
      const reason = await SalesChannel.findOneAndUpdate({ _id: id }, { $set: { ...update } });
      io.to(`request-status-list-${team._id}`).emit('REFRESH', {
        update: true
      });
      res.status(200).json({
        ...reason
      });
    } catch (e) {
      /* istanbul ignore next */
      logger.error(`SalesChannelController.apiUpdate: Async Error. email: ${req.user.email}`);
      res.status(500).json(e);
    }
  }

  public async apiDelete(req: IRequest, res: Response) {
    const { team } = req.user;
    const { id } = req.params;
    try {
      logger.info(`SalesChannelController.apiUpdate email: ${req.user.email}, params: ${JSON.stringify(req.params)}`);
      const reason = await SalesChannel.findOneAndDelete({ _id: id, team });
      io.to(`request-status-list-${team._id}`).emit('REFRESH', {
        update: true
      });
      res.status(200).json({
        ...reason
      });
    } catch (e) {
      /* istanbul ignore next */
      logger.error(`SalesChannelController.apiDelete: Async Error. email: ${req.user.email}`);
      res.status(500).json(e);
    }
  }

  public async apiList(req: IRequest, res: Response) {
    const team = req.user.team._id;
    const { page, pageSize } = req.query as { page: string; pageSize: string };
    // paginate options
    const options: PaginateOptions = {
      sort: {
        name: 1
      },
      select: {
        name: true,
        updatedAt: true,
        createdAt: true
      },
      page: parseInt(page ? page : '1', 10),
      limit: parseInt(pageSize ? pageSize : '20', 10)
    };
    try {
      logger.info(`SalesChannelController.apiList email: ${req.user.email}, query: ${JSON.stringify(req.query)} `);
      const channels = await this.getChannels({ team }, options);
      /* istanbul ignore if  */
      if (options.page && channels.pages && channels.pages < options.page) {
        res.status(400).json({
          message: 'La página solicitada no existe.',
          status: 400
        });
      } else {
        res.json({
          count: channels.total,
          pages: channels.pages,
          hasPrevious: options.page && options.page > 1 && channels.pages && channels.pages >= options.page,
          hasNext: options.page && channels.pages && channels.pages > options.page,
          results: channels.docs,
          status: 200
        });
      }
    } catch (e) {
      /* istanbul ignore next */
      logger.error(`SalesChannelController.apiList: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
      res.status(500).json(e);
    }
  }

  public async updateFleet(req: IRequest, res: Response) {
    const { team } = req.user;
    try {
      const fleetChannel = await SalesChannel.findOne({ team, fleet: true });
      if (fleetChannel) {
        await Request.updateMany({ team, fleet: true }, { $set: { channel: fleetChannel } });
      }
      res.json({
        created: 'ok'
      });
    } catch (e) {
      /* istanbul ignore next */
      logger.error(`SalesChannelController.updateFleet: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
      res.status(500).json(e);
    }
  }

  public async createDefault(req: IRequest, res: Response) {
    const { team } = req.user;
    SalesChannel.insertMany([{
      name: 'Retail',
      team,
      fleet: false
    }, {
      name: 'Digital',
      team,
      fleet: false
    }, {
      name: 'Flota',
      team,
      fleet: true
    }]);
    res.json({ created: 'ok' });
  }

  private getChannels(filter: any, options: PaginateOptions): Promise<PaginateResult<ISalesChannelModel>> {
    return new Promise((resolve, reject) => {
      SalesChannel.paginate(filter, options, (err, result) => {
        if (err) {
          return reject(err);
        }
        return resolve(result);
      });
    });
  }
}

export default new SalesChannelController();
