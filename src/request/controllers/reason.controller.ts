import {PaginateOptions, PaginateResult} from 'mongoose';
import Reason, {IReasonModel} from '../models/reason.model';
import {IRequest} from '../../interfaces/global.interface';
import {Response} from 'express';
import logger from '../../services/logger.service';

class ReasonController {

  constructor() {
    this.apiList = this.apiList.bind(this);
  }

  public async apiList(req: IRequest, res: Response) {
    logger.info(`ReasonController.apiList`);
    logger.info(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
    const {team} = req.user;
    const {page, pageSize} = req.query as { page: string; pageSize: string };
    // paginate options
    const options: PaginateOptions = {
      sort: {
        name: 1
      },
      select:{
        name: true,
        file: true,
        updatedAt: true,
        createdAt: true
      },
      page: parseInt(page ? page : '1', 10),
      limit: parseInt(pageSize ? pageSize : '20', 10)
    };
    try {
      const reasons = await this.getReasons({team}, options);
      /* istanbul ignore if  */
      if (options.page && reasons.pages && reasons.pages < options.page) {
        res.status(400).json({
          message: 'La página solicitada no existe.',
          status: 400
        });
      } else {
        res.json({
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
      res.status(500).json(e);
    }
  }

  private getReasons(filter: any, options: PaginateOptions): Promise<PaginateResult<IReasonModel>>{
    return new Promise((resolve, reject) => {
      Reason.paginate(filter, options, (err, result)=>{
        if (err) {
          return reject(err);
        }
        return resolve(result);
      });
    });
  }
}

export default new ReasonController();
