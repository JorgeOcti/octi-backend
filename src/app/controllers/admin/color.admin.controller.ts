import { Response } from 'express';
import { IRequest } from '../../../interfaces/global.interface';
import Color, { ColorSchema } from '../../models/color.model';
import BaseAdminController from './base.admin.controller';

class AdminColorController extends BaseAdminController<ColorSchema> {

  constructor() {
    super(Color);
    this.apiList = this.apiList.bind(this);
    this.apiCreate = this.apiCreate.bind(this);
    this.apiUpdate = this.apiUpdate.bind(this);
    this.apiDelete = this.apiDelete.bind(this);
  }

  public async apiCreate(req: IRequest, res: Response): Promise<any> {
    const { name } = req.body;
    const team = req.user.team._id;
    req.context = {
      name: 'Color',
      socketName: `color-list-${team}`,
      data: { team, name },
      filter: { team, name }
    };
    super.apiCreate(req, res);
  }

  public async apiUpdate(req: IRequest, res: Response): Promise<any> {
    const { id } = req.params;
    const team = req.user.team._id;
    const { name } = req.body;
    req.context = {
      name: 'Color',
      socketName: `color-list-${team}`,
      filter: { team, _id: id },
      data: { name },
      // permissionRequired: 'changeColor'
    };
    super.apiUpdate(req, res);
  }

  public async apiDelete(req: IRequest, res: Response): Promise<any> {
    const { id } = req.params;
    const team = req.user.team._id;
    req.context = {
      name: 'Color',
      socketName: `color-list-${team}`,
      filter: { team, _id: id },
      // permissionRequired: 'deleteColor'
    };
    super.apiDelete(req, res);
  }

  public async apiList(req: IRequest, res: Response): Promise<any> {
    const team = req.user.team._id;
    this.paginateOptions = {
      select: {
        name: true
      },
      sort: {
        name: 1
      }
    };
    req.context = {
      name: 'Color',
      filter: { team }
    };
    super.apiList(req, res);
  }
}

export default new AdminColorController();
