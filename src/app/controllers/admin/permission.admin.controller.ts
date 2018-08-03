import {Response} from 'express';
import {PaginateOptions, PaginateResult} from 'mongoose';
import {IRequest} from '../../../interfaces/global.interface';

import Permission, {IPermissionModel} from '../../models/permision.model';

class AdminPermissionController {

  constructor() {
    this.index = this.index.bind(this);
  }

  public async index(req: IRequest, res: Response) {
    await this.getPermissions({});
    res.render('app/index', {token: await req.user.generateToken()});
  }

  private getPermissions(options: PaginateOptions, search?: string): Promise<PaginateResult<IPermissionModel>> {
    let filter = {};
    if (search && search.length) {
      const searchText = new RegExp(search, 'i');
      filter = {
        $and: [{
          $or: [{
              vin: {$regex: searchText}
            }, {
              brand: {$regex: searchText}
            }, {
              denomination: {$regex: searchText}
            }, {
              color: {$regex: searchText}
            }]
          },
          filter
        ]
      };
      // filter = {
      //   $text: { $search: search }, company
      // };
      /* {score: {$meta: "toextScore"} */
    }

    return new Promise((resolve, reject) => {
      Permission.paginate(filter, options, (err, result) => {
        if (err) {
          return reject(err);
        }
        return resolve(result);
      });
    });
  }

}

export default new AdminPermissionController();
