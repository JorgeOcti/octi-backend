import {Response} from 'express';
import {PaginateOptions, PaginateResult} from 'mongoose';
import {IRequest} from '../../../interfaces/global.interface';
import Permission, {IPermissionModel} from '../../models/permision.model';

class AdminPermissionController {

  constructor() {
    this.index = this.index.bind(this);
    this.apiListPermissions = this.apiListPermissions.bind(this);
  }

  public async index(req: IRequest, res: Response) {
    res.render('app/index', {token: await req.user.generateToken()});
  }

  public async apiListPermissions(req: IRequest, res: Response): Promise<any> {
    // if (!req.user.hasPermission('viewCar')) {
    //   return res.status(403).json({
    //     message: 'No tiene permisos para esta operación'
    //   });
    // }
    const {page, pageSize, search} = req.query;
    // paginate options
    const options: PaginateOptions = {
      select: {
        name: true,
        codeName: true
      },
      sort: {
        name: 1
      },
      page: parseInt(page ? page : 1, 10),
      limit: parseInt(pageSize ? pageSize : 20, 10)
    };
    try {
      const permissions = await this.getPermissions(options, search);
      // validate exist page
      if (options.page && permissions.pages && permissions.pages < options.page) {
        res.status(400).json({
          error: 'La página solicitada no existe.',
          status: 200
        });
      } else {
        res.json({
          count: permissions.total,
          pages: permissions.pages,
          hasPrevious: options.page && options.page > 1 && permissions.pages && permissions.pages >= options.page,
          hasNext: options.page && permissions.pages && permissions.pages > options.page,
          results: permissions.docs,
          status: 200
        });
      }
    } catch (e) {
      if (e) {
        res.status(500).json(e);
      }
    }
  }

  private getPermissions(options: PaginateOptions, search?: string): Promise<PaginateResult<IPermissionModel>> {
    return new Promise((resolve, reject) => {
      Permission.paginate({}, options, (err, result) => {
        if (err) {
          return reject(err);
        }
        return resolve(result);
      });
    });
  }

}

export default new AdminPermissionController();
