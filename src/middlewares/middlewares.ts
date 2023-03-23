import { NextFunction, Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import BaseSchema from 'yup/lib/schema';
import type { IUser } from '../app/interfaces/user.interface';
import User from '../app/models/user.model';
import UserServices from '../app/models/user.services';
import type { IUserModel } from '../app/schemas/user.schema';
import type { IRequest } from '../interfaces/global.interface';
import logger from '../services/logger.service';
import redisClient from '../services/redis.service';

class Middlewares {

  constructor() {
    this.isLoggedIn = this.isLoggedIn.bind(this);
    this.context = this.context.bind(this);
    this.isJWTAuthenticated = this.isJWTAuthenticated.bind(this);
    this.addUserToRequest = this.addUserToRequest.bind(this);
    this.cleanStaticFiles = this.cleanStaticFiles.bind(this);
    this.validateBodyParams = this.validateBodyParams.bind(this);
  }

  public async isLoggedIn(req: IRequest | Request, res: Response, next: NextFunction) {
    // if user is authenticated in the session, carry on
    /* istanbul ignore else */
    try {
      if (req.isAuthenticated() && req?.user) {
        /* istanbul ignore else */
        const { user } = await this.addUserToRequest(req.user._id.toString(), req);
        if (user && user?.team && user?.company && user?.venue && user?.userPermissions) {
          logger.debug(`Middlewares.checkIsLoggedIn: ${req.user.email} from ${req.originalUrl}`);
          req.user = user;
          res.locals.user = user;
          return next();
        } else {
          logger.error(`Middlewares.checkIsLoggedIn: user not found in the system. URL made safe, user was sent at login!`);
          res.locals.user = null;
          return res.redirect(`/account/login/`);
        }
      } else {
        logger.error(`Middlewares.processLogin: session: ${JSON.stringify(req.session)}`);
        logger.error(`Middlewares.isLoggedIn. Attempt to access ${req.url} without credentials. URL made safe, user was sent at login!`);
        req.logout(() => {
          (req.session as any).redirectTo = req.url;
        });
        return res.redirect(`/account/login/`);
      }
    } catch (e) {
      logger.error(`Middlewares.checkIsLoggedIn: oops an error occurred in your code!. URL made safe, user was sent at login!`);
      console.error(e);
      return res.redirect(`/account/login/`);
    }
  }

  public async context(req: IRequest, res: Response, next: NextFunction) {
    req.context = {};
    return next();
  }

  public async isJWTAuthenticated(req: IRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const { headers, app } = req;
      logger.debug(`Middlewares.isJWTAuthenticated ${JSON.stringify(headers)} from from ${req.originalUrl}`);
      if (req.isAuthenticated() && req?.user) {
        /* istanbul ignore else */
        const { user } = await this.addUserToRequest(req.user._id, req);
        if (user && user?.team && user?.company && user?.venue && user?.userPermissions) {
          res.locals.user = user;
          req.user = user;
          return next();
        } else {
          logger.error(`isJWTAuthenticated error:  ${JSON.stringify(headers)}`);
          res.locals.user = null;
          return res.status(401).json({
            message: 'Debes estar autenticado para este recurso.',
            status: 401
          });
        }
      } else if (headers?.authorization && headers.authorization.split(' ')[0] === 'JWT') {
        try {
          const decode: any = jwt.verify(headers.authorization.split(' ')[1], app.locals.secretKey);
          const { user } = await this.addUserToRequest(decode._id, req);
          if (user && user?.team && user?.company) {
            res.locals.user = user;
            req.user = user;
            return next();
          } else {
            res.locals.user = null;
            return res.status(401).json({
              message: 'Debes estar autenticado para este recurso.',
              status: 401
            });
          }
        } catch (e) {
          logger.error(`isJWTAuthenticated error: ${e.message} ${JSON.stringify(headers)}`);
          res.locals.user = null;
          console.error(e);
          return res.status(401).json({
            message: e.message,
            status: 401
          });
        }
      } else {
        logger.error(`isJWTAuthenticated error1: Debes estar autenticado para este recurso. ${JSON.stringify(headers)}`);
        res.locals.user = null;
        /* istanbul ignore next */
        return res.status(401).json({
          message: 'Debes estar autenticado para este recurso.',
          status: 401
        });
      }
    } catch (e) {
      logger.error(`isJWTAuthenticated error2: Debes estar autenticado para este recurso. ${JSON.stringify(e)}`);
      res.locals.user = null;
      console.error(e);
      /* istanbul ignore next */
      return res.status(401).json({
        message: 'Debes estar autenticado para este recurso.',
        status: 401
      });
    }
  }

  public async addUserToRequest(userId: string, req?: IRequest): Promise<{ user: IUser | IUserModel }> {
    return new Promise(async (resolve, reject) => {
      let user: IUser | null;
      try {
        // try {
        const sessionCache = await redisClient.get(userId);
        if (sessionCache) {
          user = new UserServices(JSON.parse(sessionCache)).middleware();
          logger.debug(`Middlewares.refreshSession: ${user.email} with key ${userId} ${req?.originalUrl ?? 'system'}`);
          // logger.debug(`sessionCache ${sessionCache}`);
          resolve({
            user
          });
        } else {
          user = await User
            .findById(userId, {
              _id: true,
              firstName: true,
              lastName: true,
              email: true,
              preferred: true,
              isAdmin: true,
              venuesAccess: true
            })
            .populate([{
              path: 'userPermissions',
              select: ['codeName']
            }, {
              path: 'userForms',
              select: ['name'],
              match: { active: true}
            }, {
              path: 'venue',
              select: ['name']
            }, {
              path: 'company',
              select: ['name', 'iFrameURL', 'iFrameURLInventory']
            }, {
              path: 'team',
              select: ['name']
            }]);
          logger.debug(`Middlewares.refreshSession: ${user?.email} generate key ${userId} ${req?.originalUrl ?? 'system'}`);
          if (user) {
            const userCache = JSON.stringify(user);
            await redisClient.setex(userId, 60, userCache);
            resolve({
              user: new UserServices(JSON.parse(userCache)).middleware()
            });
          } else {
            reject({
              user
            });
          }
        }
        // } catch (e) {
        //   console.error(e);
        //   reject({});
        // }
      } catch (e) {
        logger.error(`Middlewares.addUserToRequest error: ${JSON.stringify(e)}`);
        console.error(e);
        reject({
          user: null
        });
      }
    });
  }

  public cleanStaticFiles(req: IRequest, res: Response, next: NextFunction) {
    req.url = req.url.replace(/\/([^\/]+)\.[0-9a-f]+\.(css|js|jpg|png|gif|svg|ico)$/, '/$1.$2');
    next();
  }

  public validateQueryParams(resourceSchema: BaseSchema) {
    return async (req: IRequest, res: Response, next: NextFunction) => {
      const resource = req.query;
      try {
        logger.info(`Middlewares.validateQueryParams resource: ${JSON.stringify(resource)}`);
        req.body = await resourceSchema.validate(resource, {
          stripUnknown: true
        });
        next();
      } catch (e) {
        console.error(e);
        res.status(400).json({
          message: e.errors.join(', '),
          status: 400
        });
      }
    };
  }

  public validateBodyParams(resourceSchema: BaseSchema) {
    return async (req: IRequest, res: Response, next: NextFunction) => {
      const resource = req.body;
      try {
        logger.info(`Middlewares.validateBodyParams resource: ${JSON.stringify(resource)}`);
        req.body = await resourceSchema.validate(resource, {
          stripUnknown: true
        });
        next();
      } catch (e) {
        console.error(e);
        res.status(400).json({
          message: e.errors.join(', '),
          status: 400
        });
      }
    };
  }

}

export default new Middlewares();
