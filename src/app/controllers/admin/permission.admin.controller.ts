import {Response} from 'express';
import {IRequest} from '../../../interfaces/global.interface';
import Permission, {PermissionSchema} from '../../models/permision.model';
import BaseAdminController from './base.admin.controller';

class AdminPermissionController extends BaseAdminController<PermissionSchema> {

  constructor() {
    super(Permission);
    this.apiList = this.apiList.bind(this);
  }

  public async apiList(req: IRequest, res: Response): Promise<any> {
    this.paginateOptions = {
      select: {
        name: true,
        codeName: true
      },
      sort: {
        name: 1
      }
    };
    req.context = {
      filter: {}
    };
    super.apiList(req, res);
  }
}

export default new AdminPermissionController();
