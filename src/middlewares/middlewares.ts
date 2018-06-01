import {Request, Response, NextFunction} from "express";
import * as jwt from "jsonwebtoken";
import {IRequest} from "../interfaces/global";

class Middlewares {

  constructor() {
    this.isLoggedIn = this.isLoggedIn.bind(this);
    this.isJWTAuthenticated = this.isJWTAuthenticated.bind(this);
  }

  public isLoggedIn(req: Request, res: Response, next: NextFunction) {
    // if user is authenticated in the session, carry on
    if (req.isAuthenticated()) {
      if (req.user) {
        res.locals.user = req.user;
      }
      else {
        res.locals.user = null;
      }
      return next();
    }
    else {
      res.redirect('/account/login/');
    }
    // if they aren't redirect them to the home page
  }

  public isJWTAuthenticated(req: IRequest, res: Response, next: NextFunction) {
    if (req.headers && req.headers.authorization && req.headers.authorization.split(' ')[0] === 'JWT') {

      jwt.verify(req.headers.authorization.split(' ')[1], req.app.locals.secretKey, (err: any, decode: any) => {
        if (err) {
          res.status(401).json({
            error: err.message,
            status: 401
          });
        }
        req.user = decode;
        next();
      });
    } else {
      // res.status(403).json({
      //   error: 'Forbidden',
      //   status: 403
      // });
      next();
    }
  }

  public cleanStaticFiles(req: IRequest, res: Response, next: NextFunction) {
    req.url = req.url.replace(/\/([^\/]+)\.[0-9a-f]+\.(css|js|jpg|png|gif|svg)$/, '/$1.$2');
    next();
  }
}

export default new Middlewares();
