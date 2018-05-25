import {Request, Response, NextFunction} from "express";

class Middlewares {

  constructor() {
    this.isLoggedIn = this.isLoggedIn.bind(this)
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
}

export default new Middlewares();
