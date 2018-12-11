import {NextFunction, Response} from 'express';
import * as jwt from 'jsonwebtoken';
import {IRequest} from '../interfaces/global.interface';
// import User from "../app/models/user.model";

class Middlewares {

  constructor() {
    this.isLoggedIn = this.isLoggedIn.bind(this);
    this.isJWTAuthenticated = this.isJWTAuthenticated.bind(this);
  }

  public async isLoggedIn(req: IRequest, res: Response, next: NextFunction) {
    // if user is authenticated in the session, carry on
    if (req.isAuthenticated()) {
      if (req.user) {
        res.locals.user = await req.user;
      } else {
        /* istanbul ignore next */
        res.locals.user = null;
      }
      return next();
    } else {
      // if they aren't redirect them to the login page
      res.redirect('/account/login/');
    }
  }

  public isJWTAuthenticated(req: IRequest, res: Response, next: NextFunction) {
    if (req.isAuthenticated()) {
      if (req.user) {
        res.locals.user = req.user;
      } else {
        /* istanbul ignore next */
        res.locals.user = null;
      }
      return next();
    } else if (req.headers && req.headers.authorization && req.headers.authorization.split(' ')[0] === 'JWT') {
      jwt.verify(req.headers.authorization.split(' ')[1], req.app.locals.secretKey, (err: any, decode: any) => {
        if (err) {
          /* istanbul ignore next */
          res.status(401).json({
            error: err.message,
            status: 401
          });
        } else {
          req.user = decode;
          next();
        }
      });
    } else {
      res.status(401).json({
        error: 'Debes estar autenticado para este recurso.',
        status: 401
      });
    }
  }

  public cleanStaticFiles(req: IRequest, res: Response, next: NextFunction) {
    req.url = req.url.replace(/\/([^\/]+)\.[0-9a-f]+\.(css|js|jpg|png|gif|svg|ico)$/, '/$1.$2');
    next();
  }
}

export default new Middlewares();
