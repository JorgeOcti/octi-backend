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

      const options: PaginateOptions = {
        select: {
          _id: true,
          description: true,
          ios: true,
          android: true,
          user: true,
          createdAt: true
        }, populate: [{
          path: 'createdBy',
          select: ['_id', 'firstName', 'lastName']
        }],
        sort: {
          createdAt: -1
        },
        page: 1,
        limit: 100
      };

      const data = await this.getVersions({}, options);
      const versions= data.docs

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

    if(!req.user.hasPermission('viewVersion')) {
      return res.status(403).json({
        message: 'No tienes permisos para esta operación'
      });
    }

    try {
      if (description && ios && android) {
        const version = await new Version({
            description,
            ios,
            android,
            createdBy: req.user
          }).save();
        res.status(201).json({
          message: 'Versión agregada satisfactoriamente',
          version: await version.populate([{
            path: 'createdBy',
            select: ['_id', 'firstName', 'lastName']
          }])
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

  private getVersions(filter: any, options: PaginateOptions): Promise<PaginateResult<Version>> {
    return new Promise((resolve, reject) => {
      Version.paginate(filter, options, (err, result) => {
        /* istanbul ignore next  */
        if (err) {
          return reject(err);
        }
        return resolve(result);
      });
    });
  }
}

export default new AdminVersionController();
