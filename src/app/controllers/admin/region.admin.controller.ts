import {Response} from 'express';
import {IRequest} from '../../../interfaces/global.interface';
import Region, { RegionSchema} from '../../models/region.model';
import BaseAdminController from './base.admin.controller';

class AdminRegionController extends BaseAdminController<RegionSchema> {

  constructor() {
    super(Region);
    this.apiList = this.apiList.bind(this);
    this.apiCreate = this.apiCreate.bind(this);
    this.apiUpdate = this.apiUpdate.bind(this);
    this.apiDelete = this.apiDelete.bind(this);
  }

  public async apiCreate(req: IRequest, res: Response): Promise<any> {
    const {name, code} = req.body;
    const team = req.user.team._id;
    req.context = {
      name: 'Región',
      data: {team, name, code},
      filter: {team, name}
    };
    super.apiCreate(req, res);
  }

  public async apiUpdate(req: IRequest, res: Response): Promise<any> {
    const {id} = req.params;
    const team = req.user.team._id;
    const {name, code} = req.body;
    req.context = {
      name: 'Región',
      filter: {team, _id: id},
      data: {name, code},
      permissionRequired: 'changeRegion'
    };
    super.apiUpdate(req, res);
  }

  public async apiDelete(req: IRequest, res: Response): Promise<any> {
    const {id} = req.params;
    const team = req.user.team._id;
    req.context = {
      name: 'Región',
      filter: {team, _id: id},
      permissionRequired: 'deleteRegion'
    };
    super.apiDelete(req, res);
  }

  public async apiList(req: IRequest, res: Response): Promise<any> {
    this.paginateOptions = {
      select: {
        name: true,
        code: true
      },
      sort: {
        name: 1
      }
    };
    super.apiList(req, res);
  }
}

const adminRegionController = new AdminRegionController();
export { adminRegionController as default};
