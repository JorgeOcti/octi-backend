import {Response} from 'express';
import {PaginateOptions, PaginateResult} from 'mongoose';
import {IAnyObject, IRequest} from '../../../interfaces/global.interface';

export default abstract class BaseAdminController<T> {

  public paginateOptions: PaginateOptions;
  public data?: IAnyObject;
  public name?: string;
  public filter?: IAnyObject;
  protected instanceModel: T | any;

  constructor(instanceModel: T) {
    this.instanceModel = instanceModel;
    this.apiList = this.apiList.bind(this);
    this.apiCreate = this.apiCreate.bind(this);
    this.getDataPaginated = this.getDataPaginated.bind(this);
  }

  public async index(req: IRequest, res: Response) {
    res.render('app/index', {token: await req.user.generateToken()});
  }

  public async apiCreate(req: IRequest, res: Response): Promise<any> {
    try {
      const existInstance = await this.instanceModel.find(this.filter ? this.filter : {});
      if (existInstance.length) {
        res.status(400).json({
          message: `${this.name} ya existe.`,
          status: 400
        });
      } else {
        const result = new this.instanceModel(this.data);
        await result.save();
        res.status(201).json({
          message: `${this.name} creado/a satisfactoriamente.`,
          result
        });
      }
    } catch (e) {
      /* istanbul ignore next  */
      if (e) {
        res.status(500).json(e);
      }
    }
  }

  public async apiList(req: IRequest, res: Response): Promise<any> {
    const {page, pageSize} = req.query;
    // paginate options
    this.paginateOptions = {
      ...this.paginateOptions,
      page: parseInt(page ? page : 1, 10),
      limit: parseInt(pageSize ? pageSize : 20, 10)
    };
    try {
      const data = await this.getDataPaginated({
        filter: this.filter ? this.filter : {}
      });
      // validate exist page
      /* istanbul ignore if  */
      if (this.paginateOptions.page && data.pages && data.pages < this.paginateOptions.page) {
        res.status(404).json({
          message: 'La página solicitada no existe.',
          status: 404
        });
      } else {
        res.json({
          count: data.total,
          pages: data.pages,
          hasPrevious: this.paginateOptions.page && this.paginateOptions.page > 1 && data.pages && data.pages >= this.paginateOptions.page,
          hasNext: this.paginateOptions.page && data.pages && data.pages > this.paginateOptions.page,
          results: data.docs,
          status: 200
        });
      }
    } catch (e) {
      /* istanbul ignore next  */
      if (e) {
        res.status(500).json(e);
      }
    }
  }

  private getDataPaginated({filter}: { filter: IAnyObject }): Promise<PaginateResult<T>> {
    return new Promise(async (resolve, reject) => {
      try {
        resolve(await this.instanceModel.paginate(filter, this.paginateOptions));
      } catch (e) {
        /* istanbul ignore next  */
        reject(e);
      }
    });
  }
}
