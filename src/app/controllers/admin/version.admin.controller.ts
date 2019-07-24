import {Response} from 'express';
import {IRequest} from '../../../interfaces/global.interface';
import Alert from '../../models/alert.model';
import Version from "../../models/version.model";

class AdminVersionController {

  constructor() {
    this.index = this.index.bind(this);
    this.apiListVersions = this.apiListVersions.bind(this);
    this.apiCreateVersion = this.apiCreateVersion.bind(this);
    this.apiDeleteAlert = this.apiDeleteAlert.bind(this);
  }

  public async index(req: IRequest, res: Response) {
    res.render('app/index', {token: await req.user.generateToken()});
  }

  public async apiListVersions(req: IRequest, res: Response) {
    const {team} = req.user;
    try {

      const versions = await Version
        .find({})
        .sort({
          createdAt: -1
        });
      res.json({
        versions
      })

    } catch (e) {
      /* istanbul ignore next */
      res.status(400).json({
        message: e,
        status: 400
      });
    }
  }

  public async apiCreateVersion(req: IRequest, res: Response) {
    const {description, ios, android} = req.body;

    //if (!req.user.hasPermission('viewCar')) {
    if(false) {
      return res.status(403).json({
        message: 'No tienes permisos para esta operación'
      });
    }

    try {
      if (description && ios && android) {
        const version = await Version
          .create({
            description,
            ios,
            android,
            createdBy: req.user
          });
        res.status(201).json({
          message: 'Versión agregada satisfactoriamente',
          version: await Version
            .findOne({
              _id: version._id,
              //team
            })
        });
      } else {
        /* istanbul ignore next */
        res.status(400).json({
          message: 'No se ha podido crear la versión'
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
    const {team} = req.user;
    try {
      const alert = await Alert.findOneAndRemove({_id: id, team});
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

export default new AdminVersionController();
