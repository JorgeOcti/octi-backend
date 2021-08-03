import {NextFunction, Response} from 'express';
import * as jwt from 'jsonwebtoken';
import {IRequest} from '../interfaces/global.interface';
import logger from '../services/logger.service';
import User, {IUserModel} from "../app/models/user.model";
import BaseSchema from "yup/lib/schema";

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
    const {headers, app} = req;
    let {user} = req;
    if (req.isAuthenticated()) {
      /* istanbul ignore else */
      if (user) {
        res.locals.user = user;
      } else {
        res.locals.user = null;
      }
      return next();
    } else if (headers && headers.authorization && headers.authorization.split(' ')[0] === 'JWT') {
      jwt.verify(headers.authorization.split(' ')[1], app.locals.secretKey, async (err: any, decode: any) => {
        /* istanbul ignore if */
        if (err) {
          logger.error(`isJWTAuthenticated error: ${err.message} ${JSON.stringify(headers)}`);
          res.status(401).json({
            error: err.message,
            status: 401
          });
        } else {
          await this.addUserToRequest(req, decode._id);
          next();
        }
      });
    } else {
      logger.error(`isJWTAuthenticated error: Debes estar autenticado para este recurso. ${JSON.stringify(headers)}`);
      /* istanbul ignore next */
      res.status(401).json({
        error: 'Debes estar autenticado para este recurso.',
        status: 401
      });
    }
  }

  public async addUserToRequest(req: IRequest, userId: string): Promise<void> {
    req.user = await User.findById(userId, {
      _id: true,
      firstName: true,
      lastName: true,
      isAdmin: true,
      email: true,
      preferred: true,
      venuesAccess: true
    }).populate([{
      path: 'userPermissions',
      select: ['codeName']
    }, {
      path: 'userForms',
      select: ['name']
    }, {
      path: 'venue',
      select: ['name']
    }, {
      path: 'company',
      select: ['name', "iFrameURL"]
    }, {
      path: 'team',
      select: ['name']
    }]) as IUserModel;
  }

  public cleanStaticFiles(req: IRequest, res: Response, next: NextFunction) {
    req.url = req.url.replace(/\/([^\/]+)\.[0-9a-f]+\.(css|js|jpg|png|gif|svg|ico)$/, '/$1.$2');
    next();
  }

  public validateBody(resourceSchema: BaseSchema) {
    return async (req: IRequest, res: Response, next: NextFunction) => {
      const resource = req.body;
      try {
        req.body = await resourceSchema.validate(resource, {
          stripUnknown: true
        });
        next();
      } catch (e) {
        console.error(e);
        res.status(400).json({error: e.errors.join(', ')});
      }
    }
  }

}

export default new Middlewares();
