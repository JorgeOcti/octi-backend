import { IRequest } from '../../interfaces/global.interface';
import { Response } from 'express';
import { PaginateOptions, PaginateResult } from 'mongoose';
import RequestItemStatus, { IRequestItemStatusModel } from '../models/requestItemStatus.model';
import logger from '../../services/logger.service';

class RequestItemStatusController {

  constructor() {
    this.apiList = this.apiList.bind(this);
  }

  public async apiList(req: IRequest, res: Response) {
    const { page, pageSize } = req.query as { page: string; pageSize: string };
    const { team } = req.user;
    const options: PaginateOptions = {
      sort: {
        weigth: 1
      },
      page: parseInt(page ? page : '1', 10),
      limit: parseInt(pageSize ? pageSize : '200', 10)
    };
    try {
      const filter = {team};
      const requestItemStatus = await this.getRequetsItemStatus(filter, options);
      /* istanbul ignore if  */
      if (options.page && requestItemStatus.pages && requestItemStatus.pages < options.page) {
        res.status(400).json({
          message: 'La página solicitada no existe.',
          status: 400
        });
      } else {
        const min = await RequestItemStatus.findOne({ team }).sort('weigth');
        const max = await RequestItemStatus.findOne({ team }).sort('-weigth');
        res.json({
          count: requestItemStatus.total,
          pages: requestItemStatus.pages,
          min: min!.weigth,
          max: max!.weigth,
          hasPrevious: options.page && options.page > 1 && requestItemStatus.pages && requestItemStatus.pages >= options.page,
          hasNext: options.page && requestItemStatus.pages && requestItemStatus.pages > options.page,
          results: requestItemStatus.docs,
          status: 200
        });
      }
    } catch (e) {
      /* istanbul ignore next */
      logger.error(`RequestItemStatusController.apiList: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
      res.status(500).json(e);
    }
  }

  private getRequetsItemStatus(filter: any, options: PaginateOptions): Promise<PaginateResult<IRequestItemStatusModel>> {
    return new Promise((resolve, reject) => {
      RequestItemStatus.paginate(filter, options, (err, result) => {
        if (err) {
          return reject(err);
        }
        return resolve(result);
      });
    });
  }

}

export default new RequestItemStatusController();
