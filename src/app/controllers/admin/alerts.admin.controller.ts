import {Response} from 'express';
import {IRequest} from '../../../interfaces/global.interface';
import Alert from '../../models/alert.model';
import User from '../../models/user.model';

class AdminAlertsController {

  constructor() {
    this.index = this.index.bind(this);
    this.list = this.list.bind(this);
  }

  public async index(req: IRequest, res: Response) {
    res.render('app/index', {token: await req.user.generateToken()});
  }

  public async list(req: IRequest, res: Response) {
    const company = req.user.company;
    try {
      const alerts = await Alert
        .find({company})
        .populate([{
          path: 'users',
          select: ['firstName', 'lastName']
        }]);
      const users = await User
        .find({company}, {
          firstName: 1,
          lastName: 1
        });
      res.json({
        alerts,
        users
      });
    } catch (e) {
      res.status(400).json({
        message: e,
        status: 400
      });
    }
  }
}

export default new AdminAlertsController();
