import {Response} from 'express';
import {IRequest} from '../../../interfaces/global.interface';
import Region, {RegionSchema} from '../../models/region.model';
import BaseAdminController from './base.admin.controller';

class AdminRegionController extends BaseAdminController<RegionSchema> {

  constructor() {
    super(Region);
    this.apiList = this.apiList.bind(this);
  }

  public async apiCreate(req: IRequest, res: Response): Promise<any> {
    const {name} = req.body;
    const {team} = req.user;
    this.name = 'Region';
    this.filter = {
      team,
      name
    };
    super.apiCreate(req, res);
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
    super.apiList(req, res);
  }
}

export default new AdminRegionController();
