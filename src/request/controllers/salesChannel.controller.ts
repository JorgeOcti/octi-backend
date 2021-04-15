import {PaginateOptions, PaginateResult} from 'mongoose';
import {IRequest} from '../../interfaces/global.interface';
import {Response} from 'express';
import logger from '../../services/logger.service';
import SalesChannel, { ISalesChannelModel } from '../models/salesChannel.model';
import Request from '../models/request.model';
class SalesChannelController {

  constructor() {
    this.apiList = this.apiList.bind(this);
    this.getChannels = this.getChannels.bind(this);
    this.createDefault = this.createDefault.bind(this);
    this.updateFleet = this.updateFleet.bind(this);
  }

  public async apiList(req: IRequest, res: Response) {
    logger.info(`SalesChannelController.apiList`);
    logger.info(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
    const team = req.user.team._id;
    const {page, pageSize} = req.query as { page: string; pageSize: string };
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
      const channels = await this.getChannels({team}, options);
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
      if(fleetChannel){
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
    },{
      name: 'Digital',
      team,
      fleet: false
    },{
      name: 'Flota',
      team,
      fleet: true
    }]);
    res.json({created: 'ok'});
  }

  private getChannels(filter: any, options: PaginateOptions): Promise<PaginateResult<ISalesChannelModel>>{
    return new Promise((resolve, reject) => {
      SalesChannel.paginate(filter, options, (err, result)=>{
        if (err) {
          return reject(err);
        }
        return resolve(result);
      });
    });
  }
}

export default new SalesChannelController();
