import { Response } from 'express';
import { PaginateOptions, PaginateResult } from 'mongoose';
import { IRequest } from '../../interfaces/global.interface';
import { io } from '../../server';
import logger from '../../services/logger.service';
import MilestoneType, { IMilestoneTypeModel } from '../models/milestoneType.model';

class MilestoneTypeController {

  constructor() {
    this.apiList = this.apiList.bind(this);
    this.apiCreate = this.apiCreate.bind(this);
    this.apiUpdate = this.apiUpdate.bind(this);
    this.apiDelete = this.apiDelete.bind(this);
    this.getMilestoneTypes = this.getMilestoneTypes.bind(this);
  }

  public async apiCreate(req: IRequest, res: Response) {
    const { team } = req.user;
    const object = req.body;
    try {
      const reason = await new MilestoneType({ ...object, team }).save();
      io.to(`milestone-type-list-${team._id}`).emit('REFRESH', {
        update: true
      });
      res.status(200).json({
        ...reason
      });
    } catch (e) {
      /* istanbul ignore next */
      logger.error(`MilestoneTypeController.apiCreate: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
      res.status(500).json(e);
    }
  }

  public async apiUpdate(req: IRequest, res: Response) {
    const { team } = req.user;
    const { id } = req.params;
    const { body } = req;
    try {
      const milestoneType = await MilestoneType.findOneAndUpdate({ _id: id, team }, { $set: { ...body } }, { new: true });
      io.to(`milestone-type-list-${team._id}`).emit('REFRESH', {
        update: true
      });
      res.status(200).json(milestoneType);
    } catch (e) {
      /* istanbul ignore next */
      logger.error(`MilestoneTypeController.apiUpdate: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
      res.status(500).json(e);
    }
  }

  public async apiDelete(req: IRequest, res: Response) {
    const { team } = req.user;
    const { id } = req.params;
    try {
      const milestoneType = await MilestoneType.findOneAndDelete({ _id: id, team });
      io.to(`milestone-type-list-${team._id}`).emit('REFRESH', {
        update: true
      });
      res.status(200).json(milestoneType);
    } catch (e) {
      /* istanbul ignore next */
      logger.error(`MilestoneTypeController.apiDelete: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
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
      let filter = {
        team
      };
      const milestoneType = await this.getMilestoneTypes(filter, options);
      /* istanbul ignore if  */
      if (options.page && milestoneType.pages && milestoneType.pages < options.page) {
        res.status(400).json({
          message: 'La página solicitada no existe.',
          status: 400
        });
      } else {
        res.json({
          count: milestoneType.total,
          pages: milestoneType.pages,
          hasPrevious: options.page && options.page > 1 && milestoneType.pages && milestoneType.pages >= options.page,
          hasNext: options.page && milestoneType.pages && milestoneType.pages > options.page,
          results: milestoneType.docs,
          status: 200
        });
      }
    } catch (e) {
      logger.error(e);
      /* istanbul ignore next */
      logger.error(`MilestoneTypeController.apiList: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
      res.status(500).json(e);
    }
  }

  private getMilestoneTypes(filter: any, options: PaginateOptions): Promise<PaginateResult<IMilestoneTypeModel>> {
    return new Promise((resolve, reject) => {
      MilestoneType.paginate!(filter, options, (err, result) => {
        if (err) {
          return reject(err);
        }
        return resolve(result);
      });
    });
  }

}

export default new MilestoneTypeController();
