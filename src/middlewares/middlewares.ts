import {NextFunction, Response} from 'express';
import * as jwt from 'jsonwebtoken';
import {IRequest} from '../interfaces/global.interface';
import logger from '../services/logger.service';
import User from "../app/models/user.model";

class Middlewares {

  constructor() {
    this.isLoggedIn = this.isLoggedIn.bind(this);
    this.isJWTAuthenticated = this.isJWTAuthenticated.bind(this);
  }

  public async isLoggedIn(req: IRequest, res: Response, next: NextFunction) {
    // if user is authenticated in the session, carry on
    /* istanbul ignore else */
    if (req.isAuthenticated()) {
      /* istanbul ignore else */
      if (req.user) {
        res.locals.user = await req.user;
      } else {
        res.locals.user = null;
      }
      return next();
    } else {
      // if they aren't redirect them to the login page
      res.redirect('/account/login/');
    }
  }

  public async context(req: IRequest, res: Response, next: NextFunction) {
    req.context = {};
    return next();
  }

  public isJWTAuthenticated(req: IRequest, res: Response, next: NextFunction) {
    if (req.isAuthenticated()) {
      /* istanbul ignore else */
      if (req.user) {
        res.locals.user = req.user;
      } else {
        res.locals.user = null;
      }
      return next();
    } else if (req.headers && req.headers.authorization && req.headers.authorization.split(' ')[0] === 'JWT') {
      jwt.verify(req.headers.authorization.split(' ')[1], req.app.locals.secretKey, async (err: any, decode: any) => {
        /* istanbul ignore if */
        if (err) {
          logger.error(`isJWTAuthenticated error: ${err.message} ${JSON.stringify(req.headers)}`);
          res.status(401).json({
            error: err.message,
            status: 401
          });
        } else {
          req.user = await Middlewares.userInfo(decode);
          next();
        }
      });
    } else {
      logger.error(`isJWTAuthenticated error: Debes estar autenticado para este recurso. ${JSON.stringify(req.headers)}`);
      /* istanbul ignore next */
      res.status(401).json({
        error: 'Debes estar autenticado para este recurso.',
        status: 401
      });
    }
  }

  public static async userInfo(data: { _id: string }) : Promise<any> {
    try {
      const user = await User.findById(data._id, {
        firstName: 1,
        lastName: 1,
        email: 1,
        preferred: 1,
        userPermissions: 1,
        userForms: 1
      })
        .populate([{
          path: 'venue',
          select: ['name', 'lat', 'lng']
        }, {
          path: 'team',
          select: ['name']
        }, {
          path: 'company',
          select: ['name']
        }, {
          path: 'userPermissions',
          select: ['codeName']
        }, {
          path: 'userForms',
          select: ['name']
        }]).lean();
      return {
        ...user
      };
    } catch (e){
      logger.error(`userInfo error:e. ${e}`);
    }
  }

  public cleanStaticFiles(req: IRequest, res: Response, next: NextFunction) {
    req.url = req.url.replace(/\/([^\/]+)\.[0-9a-f]+\.(css|js|jpg|png|gif|svg|ico)$/, '/$1.$2');
    next();
  }
}

export default new Middlewares();
