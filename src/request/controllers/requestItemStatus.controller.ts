import { Response } from 'express';
import { PaginateOptions, PaginateResult } from 'mongoose';
import { IRequest } from '../../interfaces/global.interface';
import { io } from '../../server';
import logger from '../../services/logger.service';
import RequestItemStatus, { IRequestItemStatusModel } from '../models/requestItemStatus.model';

class RequestItemStatusController {

  constructor() {
    this.apiList = this.apiList.bind(this);
    this.apiCreate = this.apiCreate.bind(this);
    this.apiUpdate = this.apiUpdate.bind(this);
    this.apiDelete = this.apiDelete.bind(this);
  }

  public async apiCreate(req: IRequest, res: Response) {
    const { team } = req.user;
    const object = req.body;
    try {
      const reason = await new RequestItemStatus({ ...object, team }).save();
      io.to(`request-status-list-${team._id}`).emit('REFRESH', {
        update: true
      });
      res.status(200).json({
        ...reason
      });
    } catch (e) {
      /* istanbul ignore next */
      logger.error(`RequestItemStatusController.apiCreate: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}`);
      res.status(500).json(e);
    }
  }

  public async apiUpdate(req: IRequest, res: Response) {
    const { team } = req.user;
    const { id } = req.params;
    const update = req.body;
    try {
      if (update.default) {
        await RequestItemStatus.updateMany({ team }, { $set: { default: false } });
      }
      const reason = await RequestItemStatus.findOneAndUpdate({ _id: id, team }, { $set: { ...update } });
      io.to(`request-status-list-${team._id}`).emit('REFRESH', {
        update: true
      });
      res.status(200).json({
        ...reason
      });
    } catch (e) {
      /* istanbul ignore next */
      logger.error(`RequestItemStatusController.apiUpdate: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}`);
      res.status(500).json(e);
    }
  }

  public async apiDelete(req: IRequest, res: Response) {
    const { team } = req.user;
    const { id } = req.params;
    try {
      const reason = await RequestItemStatus.findOneAndDelete({ _id: id, team });
      io.to(`request-status-list-${team._id}`).emit('REFRESH', {
        update: true
      });
      res.status(200).json({
        ...reason
      });
    } catch (e) {
      /* istanbul ignore next */
      logger.error(`RequestItemStatusController.apiDelete: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}`);
      res.status(500).json(e);
    }
  }

  public async apiList(req: IRequest, res: Response) {
    const { page, pageSize } = req.query as { page: string; pageSize: string };
    const team = req.user.team._id;
    const options: PaginateOptions = {
      sort: {
        weigth: 1
      },
      page: parseInt(page ? page : '1', 10),
      limit: parseInt(pageSize ? pageSize : '200', 10)
    };
    try {
      const filter = { team };
      const requestItemStatus = await this.getRequetsItemStatus(filter, options);
      /* istanbul ignore if  */
      if (options.page && requestItemStatus.pages && requestItemStatus.pages < options.page) {
        return res.status(400).json({
          message: 'La página solicitada no existe.',
          status: 400
        });
      } else {
        const min = await RequestItemStatus.findOne({ team }).sort('weigth');
        const max = await RequestItemStatus.findOne({ team }).sort('-weigth');
        return res.json({
          count: requestItemStatus.total,
          pages: requestItemStatus.pages,
          min: min ? min.weigth : 0,
          max: max ? max.weigth : 1,
          hasPrevious: options.page && options.page > 1 && requestItemStatus.pages && requestItemStatus.pages >= options.page,
          hasNext: options.page && requestItemStatus.pages && requestItemStatus.pages > options.page,
          results: requestItemStatus.docs,
          status: 200
        });
      }
    } catch (e) {
      logger.error(e);
      /* istanbul ignore next */
      logger.error(`RequestItemStatusController.apiList: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}`);
      return res.status(500).json(e);
    }
  }

  private getRequetsItemStatus(filter: any, options: PaginateOptions): Promise<PaginateResult<IRequestItemStatusModel>> {
    return new Promise((resolve, reject) => {
      RequestItemStatus.paginate!(filter, options, (err, result) => {
        if (err) {
          return reject(err);
        }
        return resolve(result);
      });
    });
  }

}

export default new RequestItemStatusController();
