import { Response } from 'express';
import { PaginateOptions, PaginateResult } from 'mongoose';
import { IRequest } from '../../interfaces/global.interface';
import logger from '../../services/logger.service';
import { io } from '../../server';
import Reason, { IReasonModel } from '../models/reason.model';

class ReasonController {

  constructor() {
    this.apiList = this.apiList.bind(this);
    this.apiCreate = this.apiCreate.bind(this);
    this.apiUpdate = this.apiUpdate.bind(this);
    this.apiDelete = this.apiDelete.bind(this);
  }

  public async apiList(req: IRequest, res: Response) {
    logger.info(`ReasonController.apiList`);
    logger.info(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
    const team = req.user.team._id;
    const { page, pageSize } = req.query as { page: string; pageSize: string };

    // paginate options
    const options: PaginateOptions = {
      sort: {
        name: 1
      },
      select: {
        name: true,
        file: true,
        questions: true,
        updatedAt: true,
        createdAt: true
      },
      page: parseInt(page ? page : '1', 10),
      limit: parseInt(pageSize ? pageSize : '20', 10)
    };
    try {
      const reasons = await this.getReasons({ team }, options);
      /* istanbul ignore if  */
      if (options.page && reasons.pages && reasons.pages < options.page) {
        return res.status(400).json({
          message: 'La página solicitada no existe.',
          status: 400
        });
      } else {
        return res.json({
          count: reasons.total,
          pages: reasons.pages,
          hasPrevious: options.page && options.page > 1 && reasons.pages && reasons.pages >= options.page,
          hasNext: options.page && reasons.pages && reasons.pages > options.page,
          results: reasons.docs,
          status: 200
        });
      }
    } catch (e) {
      /* istanbul ignore next */
      logger.error(`ReasonController.apiList: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
      return res.status(500).json(e);
    }
  }

  public async apiCreate(req: IRequest, res: Response) {
    const { team } = req.user;
    const object = req.body;
    try {
      const reason = await new Reason({...object, team}).save();
      io.to(`reasons-list-${team._id}`).emit('REFRESH', {
        update: true
      });
      res.status(200).json({
        ...reason
      });
    } catch (e) {
      /* istanbul ignore next */
      logger.error(`ReasonController.apiCreate: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
      res.status(500).json(e);
    }
  }

  public async apiUpdate(req: IRequest, res: Response) {
    const { team } = req.user;
    const { id } = req.params;
    const update = req.body;
    try {
      const reason = await Reason.findOneAndUpdate({ _id: id }, { $set: { ...update } });
      io.to(`reasons-list-${team._id}`).emit('REFRESH', {
        update: true
      });
      res.status(200).json({
        ...reason
      });
    } catch (e) {
      /* istanbul ignore next */
      logger.error(`ReasonController.apiUpdate: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
      res.status(500).json(e);
    }
  }

  public async apiDelete(req: IRequest, res: Response) {
    const { team } = req.user;
    const { id } = req.params;
    try {
      const reason = await Reason.findOneAndDelete({ _id: id, team });
      io.to(`reasons-list-${team._id}`).emit('REFRESH', {
        update: true
      });
      res.status(200).json({
        ...reason
      });
    } catch (e) {
      /* istanbul ignore next */
      logger.error(`ReasonController.apiDelete: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
      res.status(500).json(e);
    }
  }

  private getReasons(filter: any, options: PaginateOptions): Promise<PaginateResult<IReasonModel>> {
    return new Promise((resolve, reject) => {
      Reason.paginate(filter, options, (err, result) => {
        if (err) {
          return reject(err);
        }
        return resolve(result);
      });
    });
  }
}

export default new ReasonController();
