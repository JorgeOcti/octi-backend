import { Response } from 'express';
import { PaginateOptions, PaginateResult } from 'mongoose';
import { IRequest } from '../../interfaces/global.interface';
import { socket } from '../../services/socket.service';
import logger from '../../services/logger.service';
import OperationType, { IOperationTypeModel } from '../models/operationType.model';

class OperationTypeController {

  constructor() {
    this.apiList = this.apiList.bind(this);
    this.apiCreate = this.apiCreate.bind(this);
    this.apiUpdate = this.apiUpdate.bind(this);
    this.apiDelete = this.apiDelete.bind(this);
    this.getOperationTypes = this.getOperationTypes.bind(this);
  }

  public async apiCreate(req: IRequest, res: Response) {
    const { team } = req.user;
    const object = req.body;
    try {
      const reason = await new OperationType({ ...object, team }).save();
      socket().to(`operation-type-list-${team._id}`).emit('REFRESH', {
        update: true
      });
      res.status(200).json({
        ...reason
      });
    } catch (e) {
      /* istanbul ignore next */
      logger.error(`OperationTypeController.apiCreate: Async Error.`);
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
        await OperationType.updateMany({ team }, { $set: { default: false } });
      }
      const reason = await OperationType.findOneAndUpdate({ _id: id, team }, { $set: { ...update } }, {new: true});
      socket().to(`operation-type-list-${team._id}`).emit('REFRESH', {
        update: true
      });
      res.status(200).json(reason);
    } catch (e) {
      /* istanbul ignore next */
      logger.error(`OperationTypeController.apiUpdate: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}`);
      res.status(500).json(e);
    }
  }

  public async apiDelete(req: IRequest, res: Response) {
    const { team } = req.user;
    const { id } = req.params;
    try {
      const reason = await OperationType.findOneAndDelete({ _id: id, team });
      socket().to(`operation-type-list-${team._id}`).emit('REFRESH', {
        update: true
      });
      res.status(200).json({
        ...reason
      });
    } catch (e) {
      /* istanbul ignore next */
      logger.error(`OperationTypeController.apiDelete: Async Error.`);
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
      const operationType = await this.getOperationTypes(filter, options);
      /* istanbul ignore if  */
      if (options.page && operationType.pages && operationType.pages < options.page) {
        res.status(400).json({
          message: 'La página solicitada no existe.',
          status: 400
        });
      } else {
        res.json({
          count: operationType.total,
          pages: operationType.pages,
          hasPrevious: options.page && options.page > 1 && operationType.pages && operationType.pages >= options.page,
          hasNext: options.page && operationType.pages && operationType.pages > options.page,
          results: operationType.docs,
          status: 200
        });
      }
    } catch (e) {
      logger.error(e);
      /* istanbul ignore next */
      logger.error(`OperationTypeController.apiList: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}`);
      res.status(500).json(e);
    }
  }

  private getOperationTypes(filter: any, options: PaginateOptions): Promise<PaginateResult<IOperationTypeModel>> {
    return new Promise((resolve, reject) => {
      OperationType.paginate!(filter, options, (err, result) => {
        if (err) {
          return reject(err);
        }
        return resolve(result);
      });
    });
  }

}

export default new OperationTypeController();
