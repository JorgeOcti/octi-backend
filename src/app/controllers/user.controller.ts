import * as bcrypt from 'bcrypt';
import { Response } from 'express';
import { PaginateOptions, PaginateResult } from 'mongoose';
import Permission from "../../billing/models/permission.model";
import { IRequest } from '../../interfaces/global.interface';
import logger from '../../services/logger.service';
import PushService from '../../services/push.service';
import { default as User, default as UserModel } from '../models/user.model';
import Venue from '../models/venue.model';
import { IUserModel } from '../schemas/user.schema';
import Brand from "../models/brand.model";

class UserController {

  constructor() {
    this.apiChangePassword = this.apiChangePassword.bind(this);
    this.apiListVenues = this.apiListVenues.bind(this);
    this.apiListDrivers = this.apiListDrivers.bind(this);
    this.getUsers = this.getUsers.bind(this);
    this.getStatsAccessUser = this.getStatsAccessUser.bind(this);
    this.apiChangeVenue = this.apiChangeVenue.bind(this);
  }

  public async apiListDrivers(req: IRequest, res: Response) {
    const team = req.user.team._id;
    const {
      page,
      pageSize,
    } = req.query as { page: string; pageSize: string; };
    // paginate options
    const options: PaginateOptions = {
      sort: {
        firstName: 1
      },
      select: {
        firstName: true,
        lastName: true,
        email: true,
        venue: true
      },
      populate: [{
        path: 'company',
        select: ['name']
      }, {
        path: 'venue',
        select: ['name']
      }],
      customLabels: {
        totalDocs: 'total',
        docs: 'docs',
        limit: 'perPage',
        page: 'currentPage',
        nextPage: 'next',
        prevPage: 'prev',
        totalPages: 'pages',
        pagingCounter: 'si'
      },
      lean: true,
      // allowDiskUse: true,
      page: parseInt(page ? page : '1', 10),
      limit: parseInt(pageSize ? pageSize : '200', 10)
    };
    const filter: any = {
      team,
      isDriver: true
    };
    try {
      logger.info(`UserController.apiListDrivers email: ${req.user.email}`);
      logger.debug(`UserController.apiListDrivers email: ${req.user.email} query: ${JSON.stringify(req.query)}`);
      logger.debug(`UserController.apiListDrivers email: ${req.user.email} options: ${JSON.stringify(options)}`);
      const drivers = await this.getUsers(filter, options);
      /* istanbul ignore if  */
      if (options.page && drivers.pages && drivers.pages < options.page) {
        res.status(400).json({
          message: 'La página solicitada no existe.',
          status: 400
        });
      } else {
        res.json({
          count: drivers.total,
          pages: drivers.pages,
          hasPrevious: drivers.hasPrevious,
          hasNextPage: drivers.hasNextPage,
          results: drivers.docs,
          status: 200
        });
      }
    } catch (e) {
      /* istanbul ignore next */
      logger.error(`UserController.apiListDrivers: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}`);
      res.status(500).json(e);
    }
  }

  public async apiChangePassword(req: IRequest, res: Response) {
    const user = req.user;
    const { password, newPassword } = req.body;
    logger.info(`UserController.apiChangePassword email: ${req.user.email} password: ***-***, newPassword: ***-***`);
    if (password && password.trim().length && newPassword && newPassword.trim().length) {
      try {
        const User = await UserModel.findById(user._id);
        if (User) {
          const isPassword = bcrypt.compareSync(password, User.password!);
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
    const team = req.user.team._id;
    logger.info(`UserController.apiListVenues email: ${req.user.email}`);
    try {
      const currentUser = await UserModel.findById(req.user._id);
      if (currentUser) {
        let data = await Venue.find({
          _id: {
            $in: currentUser.venuesPermissions()
          },
          team
        }, {
          name: true,
          lat: true,
          lng: true
        })

        res.status(200).json({
          data,
          venues: data,
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

  public async apiListBrands(req: IRequest, res: Response) {
    const team = req.user.team._id;
    logger.info(`UserController.apiListBrands email: ${req.user.email}`);
    try {
      const currentUser = await UserModel.findById(req.user._id);
      if (currentUser) {
        res.status(200).json({
          brands: await Brand.find({
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
    const team = req.user.team._id;
    const { venue } = req.body;
    try {
      logger.info(`UserController.apiChangeVenue { email: ${req.user.email}, body: ${JSON.stringify(req.body)} }`);
      const currentUser = await UserModel.findById(req.user._id);
      const currentVenue = await Venue.findOne({ _id: venue, team });
      if (currentUser && currentVenue && currentUser.venuesPermissions(true).includes(venue)) {
        // currentUser.venue = currentVenue;
        // currentUser.company = currentVenue.company;
        await User.updateOne({_id: currentUser._id}, {
          $set: {
            venue: currentVenue._id,
            company: currentVenue.company
          },
          $addToSet: {
            venuesAccess: { $each: [currentUser.venue]}
          }
        })
        // await currentUser.save();
        return res.status(200).json({
          message: 'Usuario editado satisfactoriamente.',
          status: 200
        });
      } else {
        /* istanbul ignore next */
        logger.error(`apiChangeVenue: Ha ocurrido un error.`);
        return res.status(400).json({
          message: 'Operación no permitida',
          status: 400
        });
      }
    } catch (e) {
      logger.error(`apiChangeVenue: Async Error.`);
      logger.error(e);
      /* istanbul ignore next */
      return res.status(500).json({
        message: 'Ha ocurrido un error',
        status: 500
      });
    }
  }

  private getUsers(filter: any, options: PaginateOptions): Promise<PaginateResult<IUserModel>> {
    return new Promise((resolve, reject) => {
      User.paginate!(filter, options, (err, result) => {
        /* istanbul ignore next  */
        if (err) {
          return reject(err);
        }
        return resolve(result);
      });
    });
  }

  public async getStatsAccessUser(req: IRequest, res: Response) {
    logger.info(`UserController.apiListStatsUser`);
    logger.info(`{user: {_id: ${req.user._id}, email: ${req.user.email}}`);
    const team = req.user.team._id;

    //TODO: Change to dinamic query instead of hardcoded
    let permissions = await Permission.find({
      codeName: { $in: ['viewInventoryStudio', 'viewDistributionStudio', 'viewChecklistStudio', 'viewPlanificationStudio'] }
    })

    logger.info(JSON.stringify(permissions))

    // paginate options
    const options: PaginateOptions = {
      limit: 200,
      sort: {
        firstName: 1
      },
      select: {
        firstName: true,
        lastName: true,
      }
    };
    const filter: any = {
      team,
      userPermissions: { $in: permissions.map(p => p._id) }
    };
    try {
      const users = await this.getUsers(filter, options);
      /* istanbul ignore if  */

      res.json({
        results: users.docs,
        status: 200
      });
    } catch (e) {
      /* istanbul ignore next */
      logger.error(`UserController.apiListDrivers: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}`);
      res.status(500).json(e);
    }
  }

  public async getPusherToken(req: IRequest, res: Response) {
    if (req.user._id === req.query['user_id'])
      res.status(200).json(PushService.createAuthToken(req.user._id,));
    else
      res.status(401).json({ message: 'Authentication failed. User provided does not match with user_id.' });
  }
}

export default new UserController();
