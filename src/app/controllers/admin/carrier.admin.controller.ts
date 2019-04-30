import {Response} from 'express';
import {IRequest} from '../../../interfaces/global.interface';
import Carrier, {CarrierSchema} from '../../models/carrier.model';
import BaseAdminController from './base.admin.controller';

class AdminCarrierController extends BaseAdminController<CarrierSchema> {

  constructor() {
    super(Carrier);
    this.apiList = this.apiList.bind(this);
  }

  public async apiList(req: IRequest, res: Response): Promise<any> {
    this.paginateOptions = {
      select: {
        name: true
      },
      sort: {
        name: 1
      }
    };
    this.filter = {};
    super.apiList(req, res);
  }
}

export default new AdminCarrierController();
