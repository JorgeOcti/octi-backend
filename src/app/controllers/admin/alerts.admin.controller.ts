import {Response} from 'express';
import {IRequest} from '../../../interfaces/global.interface';
import Alert from '../../models/alert.model';
import User from '../../models/user.model';

class AdminAlertsController {

  constructor() {
    this.index = this.index.bind(this);
    this.apiListAlerts = this.apiListAlerts.bind(this);
    this.apiDeleteAlert = this.apiDeleteAlert.bind(this);
  }

  public async index(req: IRequest, res: Response) {
    res.render('app/index', {token: await req.user.generateToken()});
  }

  public async apiListAlerts(req: IRequest, res: Response) {
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

  public async apiDeleteAlert(req: IRequest, res: Response) {
    const {id} = req.params;
    const company = req.user.company;
    try {
      const alert = await Alert.findOneAndRemove({_id: id, company});
      if (alert) {
        const response = {
          message: 'Alerta eliminada satisfactoriamente.',
          id: alert._id
        };
        res.status(200).json(response);
      } else {
        const response = {
          id,
          message: 'Esta alerta ya fue eliminada.'
        };
        res.status(200).json(response);
      }
    } catch (e) {
      res.status(500).json(e);
    }
  }
}

export default new AdminAlertsController();
