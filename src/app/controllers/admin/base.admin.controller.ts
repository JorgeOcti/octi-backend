import {Response} from 'express';
import {PaginateOptions, PaginateResult} from 'mongoose';
import {IAnyObject, IRequest} from '../../../interfaces/global.interface';
import {IPermissionModel} from '../../models/permision.model';

export default abstract class BaseAdminController<T> {
  public paginateOptions: PaginateOptions;
  public filter: IAnyObject;
  protected instandeModel: T | any;

  constructor(instandeModel: T) {
    this.instandeModel = instandeModel;
    this.apiList = this.apiList.bind(this);
    this.getDataPaginated = this.getDataPaginated.bind(this);
  }

  public async index(req: IRequest, res: Response) {
    res.render('app/index', {token: await req.user.generateToken()});
  }

  public async apiList(req: IRequest, res: Response): Promise<any> {
    const {page, pageSize} = req.query;
    // paginate options
    this.paginateOptions.page = parseInt(page ? page : 1, 10);
    this.paginateOptions.limit = parseInt(pageSize ? pageSize : 20, 10);
    try {
      const data = await this.getDataPaginated(this.filter);
      // validate exist page
      /* istanbul ignore if  */
      if (this.paginateOptions.page && data.pages && data.pages < this.paginateOptions.page) {
        res.status(400).json({
          error: 'La página solicitada no existe.',
          status: 200
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

  private getDataPaginated(filter: IAnyObject): Promise<PaginateResult<IPermissionModel>> {
    return new Promise((resolve, reject) => {
      this.instandeModel.paginate(filter,  this.paginateOptions, (err: any, result: any) => {
        /* istanbul ignore next */
        if (err) {
          return reject(err);
        }
        return resolve(result);
      });
    });
  }
}
