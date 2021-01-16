import * as bcrypt from 'bcrypt';
import {Response} from 'express';
import {IRequest} from '../../interfaces/global.interface';
import logger from '../../services/logger.service';
import UserModel from '../models/user.model';
import Venue from '../models/venue.model';
import PushService from '../../services/push.service';

class UserController {

  constructor() {
    this.apiChangePassword = this.apiChangePassword.bind(this);
    this.apiListVenues = this.apiListVenues.bind(this);
    this.apiChangeVenue = this.apiChangeVenue.bind(this);
  }

  public async apiChangePassword(req: IRequest, res: Response) {
    const user = req.user;
    const {password, newPassword} = req.body;
    if (password && password.trim().length && newPassword && newPassword.trim().length) {
      try {
        const User = await UserModel.findById(user._id);
        if (User) {
          const isPassword = bcrypt.compareSync(password, User.password);
          if (isPassword) {
            User.password = newPassword;
            User.save();
            res.status(200).json({
              message: 'Contraseña cambiada satisfactoriamente.',
              status: 200
            });
          } else {
            res.status(400).json({
              message: 'El password actual no corresponde',
              status: 400
            });
          }
        }
      } catch (e) {
        /* istanbul ignore next */
        res.status(400).json({
          message: 'Ha ocurrido un error',
          status: 400
        });
      }
    } else {
      /* istanbul ignore next */
      res.status(400).json({
        message: 'No se ha podido cambiar la contraseña',
        status: 400
      });
    }
  }

  public async apiListVenues(req: IRequest, res: Response) {
    const {team} = req.user;
    logger.info(`apiListVenues`);
    logger.info(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
    try {
      const currentUser = await UserModel.findById(req.user._id);
      if (currentUser) {
        res.status(200).json({
          venues: await Venue.find({
            _id: {
              $in: currentUser.venuesPermissions()
            },
            team
          }, {
            name: true,
            lat: true,
            lng: true
          }),
          status: 200
        });
      } else {
        /* istanbul ignore next */
        res.status(400).json({
          message: 'Ha ocurrido un error',
          status: 400
        });
      }
    } catch (e) {
      logger.error(`apiListVenues: Async Error.`);
      logger.error(e);
      /* istanbul ignore next */
      res.status(500).json({
        message: 'Ha ocurrido un error',
        status: 500
      });
    }
  }

  public async apiChangeVenue(req: IRequest, res: Response) {
    const {team} = req.user;
    const {venue} = req.body;
    logger.info(`apiChangeVenue`);
    logger.info(`{user: {_id: ${req.user._id}, email: ${req.user.email}}, body: ${JSON.stringify(req.body)}}`);
    try {
      const currentUser = await UserModel.findById(req.user._id);
      const currentVenue = await Venue.findOne({_id: venue, team});
      if (currentUser && currentVenue && currentUser.venuesPermissions(true).includes(venue)) {
        currentUser.venue = currentVenue;
        currentUser.company = currentVenue.company;
        await currentUser.save();
        res.status(200).json({
          message: 'Usuario editado satisfactoriamente.',
          status: 200
        });
      } else {
        /* istanbul ignore next */
        logger.error(`apiChangeVenue: Ha ocurrido un error.`);
        res.status(400).json({
          message: 'Operación no permitida',
          status: 400
        });
      }
    } catch (e) {
      logger.error(`apiChangeVenue: Async Error.`);
      logger.error(e);
      /* istanbul ignore next */
      res.status(500).json({
        message: 'Ha ocurrido un error',
        status: 500
      });
    }
  }

  public async getPusherToken(req: IRequest, res: Response){
    if (req.user._id === req.query['user_id'])
      res.status(200).json(PushService.createAuthToken(req.user._id, ))
    else
      res.status(401).json({message: 'Authentication failed. User provided does not match with user_id.'});
  }
}

export default new UserController();
