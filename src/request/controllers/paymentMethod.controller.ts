import { Response } from 'express';
import { PaginateOptions, PaginateResult } from 'mongoose';
import { IRequest } from '../../interfaces/global.interface';
import { io } from '../../server';
import logger from '../../services/logger.service';
import PaymentMethodModel, { IPaymentMethodModel } from '../models/paymentMethod.model';

class PaymentMethodController {

  constructor() {
    this.apiList = this.apiList.bind(this);
    this.apiCreate = this.apiCreate.bind(this);
    this.apiUpdate = this.apiUpdate.bind(this);
    this.apiDelete = this.apiDelete.bind(this);
    this.getPaymentMethods = this.getPaymentMethods.bind(this);
  }

  public async apiCreate(req: IRequest, res: Response) {
    const { team } = req.user;
    const object = req.body;
    try {
      const reason = await new PaymentMethodModel({ ...object, team }).save();
      io.to(`payment-method-list-${team._id}`).emit('REFRESH', {
        update: true
      });
      res.status(200).json({
        ...reason
      });
    } catch (e) {
      /* istanbul ignore next */
      logger.error(`PaymentMethodController.apiCreate: Async Error.`);
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
      const reason = await PaymentMethodModel.findOneAndUpdate({ _id: id }, { $set: { ...update } });
      io.to(`payment-method-list-${team._id}`).emit('REFRESH', {
        update: true
      });
      res.status(200).json({
        ...reason
      });
    } catch (e) {
      /* istanbul ignore next */
      logger.error(`PaymentMethodController.apiUpdate: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}`);
      res.status(500).json(e);
    }
  }

  public async apiDelete(req: IRequest, res: Response) {
    const { team } = req.user;
    const { id } = req.params;
    try {
      const reason = await PaymentMethodModel.findOneAndDelete({ _id: id, team });
      io.to(`payment-method-list-${team._id}`).emit('REFRESH', {
        update: true
      });
      res.status(200).json({
        ...reason
      });
    } catch (e) {
      /* istanbul ignore next */
      logger.error(`PaymentMethodController.apiDelete: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}`);
      res.status(500).json(e);
    }
  }

  public async apiList(req: IRequest, res: Response) {
    logger.info(`PaymentMethodController.apiList`);
    logger.info(`{user: {_id: ${req.user._id}, email: ${req.user.email}}`);
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
      const paymentMethods = await this.getPaymentMethods({ team }, options);
      /* istanbul ignore if  */
      if (options.page && paymentMethods.pages && paymentMethods.pages < options.page) {
        res.status(400).json({
          message: 'La página solicitada no existe.',
          status: 400
        });
      } else {
        res.json({
          count: paymentMethods.total,
          pages: paymentMethods.pages,
          hasPrevious: options.page && options.page > 1 && paymentMethods.pages && paymentMethods.pages >= options.page,
          hasNext: options.page && paymentMethods.pages && paymentMethods.pages > options.page,
          results: paymentMethods.docs,
          status: 200
        });
      }
    } catch (e) {
      /* istanbul ignore next */
      logger.error(`PaymentMethodController.apiList: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}`);
      res.status(500).json(e);
    }
  }

  private getPaymentMethods(filter: any, options: PaginateOptions): Promise<PaginateResult<IPaymentMethodModel>> {
    return new Promise((resolve, reject) => {
      PaymentMethodModel.paginate(filter, options, (err, result) => {
        if (err) {
          return reject(err);
        }
        return resolve(result);
      });
    });
  }
}

export default new PaymentMethodController();
