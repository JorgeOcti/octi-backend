import {Response} from 'express';
import {IRequest} from '../../../interfaces/global.interface';
import Alert from '../../models/alert.model';
import User from '../../models/user.model';

class AdminAlertController {

  constructor() {
    this.index = this.index.bind(this);
    this.apiListAlerts = this.apiListAlerts.bind(this);
    this.apiCreateAlert = this.apiCreateAlert.bind(this);
    this.apiDeleteAlert = this.apiDeleteAlert.bind(this);
  }

  public async index(req: IRequest, res: Response) {
    res.render('app/index', {token: await req.user.generateToken()});
  }

  public async apiListAlerts(req: IRequest, res: Response) {
    const company = req.user.company;
    try {
      const alerts = await Alert
        .find({
          company
        }, {
          name: 1,
          users: 1,
          lte: 1,
          gte: 1
        })
        .populate([{
          path: 'users',
          select: ['firstName', 'lastName', 'email']
        }])
        .sort({
          createdAt: -1
        });
      const users = await User
        .find({company}, {
          firstName: 1,
          lastName: 1,
          email: 1
        });
      res.json({
        alerts,
        users
      });
    } catch (e) {
      /* istanbul ignore next */
      res.status(400).json({
        message: e,
        status: 400
      });
    }
  }

  public async apiCreateAlert(req: IRequest, res: Response) {
    const {name, gte, lte, users} = req.body;
    const company = req.user.company;
    try {
      if (name && users && users.length) {
        const alert = await Alert
          .create({
            name,
            gte,
            lte,
            users,
            company
          });
        res.json({
          message: 'Alerta agregada satisfactoriamente',
          alert: await Alert
            .findOne({_id: alert._id, company}, {
              name: 1,
              users: 1,
              lte: 1,
              gte: 1
            })
            .populate([{
              path: 'users',
              select: ['firstName', 'lastName', 'email']
            }])
        });
      } else {
        /* istanbul ignore next */
        res.status(400).json({
          message: 'No se a podido crear a alerta'
        });
      }
    } catch (e) {
      /* istanbul ignore next */
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
      /* istanbul ignore next */
      res.status(500).json(e);
    }
  }
}

export default new AdminAlertController();
