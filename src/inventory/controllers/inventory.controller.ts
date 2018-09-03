import {Response} from 'express';
import {IRequest} from '../../interfaces/global.interface';

class InventoryController {

  constructor() {
    this.index = this.index.bind(this);
  }
  public async index(req: IRequest, res: Response) {
    res.render('app/index', {token: await req.user.generateToken()});
  }
}
export default new InventoryController();
