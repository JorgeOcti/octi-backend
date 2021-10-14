import { IRequest } from '../../interfaces/global.interface';
import { Response } from 'express';

class MilestoneController {

  constructor() {
    this.index = this.index.bind(this);
    // this.apiList = this.apiList.bind(this);
    // this.apiDetail = this.apiDetail.bind(this);
    // this.apiCreate = this.apiCreate.bind(this);
    // this.apiUpdate = this.apiUpdate.bind(this);
    // this.apiDelete = this.apiDelete.bind(this);
  }
  public async index(req: IRequest, res: Response) {
    res.render('app/index', { token: await req.user.generateToken() });
  }

  public async apiList(req: IRequest, res: Response) {

  }

}

export default new MilestoneController();
