import {Response} from 'express';
import {IRequest} from '../../../interfaces/global.interface';
import Carrier, {CarrierSchema} from '../../models/carrier.model';
import BaseAdminController from './base.admin.controller';

class AdminCarrierController extends BaseAdminController<CarrierSchema> {

  constructor() {
    super(Carrier);
    this.index = this.index.bind(this);
    this.apiCreate = this.apiCreate.bind(this);
    this.apiList = this.apiList.bind(this);
    this.apiUpdate = this.apiUpdate.bind(this);
    this.apiDelete = this.apiDelete.bind(this);
  }

  public async index(req: IRequest, res: Response): Promise<any> {
    req.context = {
      permissionRequired: 'viewCarrier'
    };
    super.index(req, res);
  }

  public async apiCreate(req: IRequest, res: Response): Promise<any> {
    const {name} = req.body;
    const {team} = req.user;
    req.context = {
      name: 'Transportista',
      filter: {team, name},
      data: {team, name},
      permissionRequired: 'addCarrier'
    };
    super.apiCreate(req, res);
  }

  public async apiUpdate(req: IRequest, res: Response): Promise<any> {
    const {id} = req.params;
    const {team} = req.user;
    const {name} = req.body;
    req.context = {
      name: 'Transportista',
      filter: {team, _id: id},
      data: {name},
      permissionRequired: 'changeCarrier'
    };
    super.apiUpdate(req, res);
  }

  public async apiDelete(req: IRequest, res: Response): Promise<any> {
    const {id} = req.params;
    const {team} = req.user;
    req.context = {
      name: 'Transportista',
      filter: {team, _id: id},
      permissionRequired: 'deleteCarrier'
    };
    super.apiDelete(req, res);
  }

  public async apiList(req: IRequest, res: Response): Promise<any> {
    const {team} = req.user;
    this.paginateOptions = {
      select: {
        name: true
      },
      sort: {
        name: 1
      }
    };
    req.context = {
      filter: {team}
    };
    super.apiList(req, res);
  }
}

export default new AdminCarrierController();
