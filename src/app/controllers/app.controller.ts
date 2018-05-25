import {Request, Response, NextFunction} from 'express';
import * as passport from 'passport';

class AppController {

  constructor() {
    this.index = this.index.bind(this);
    this.login = this.login.bind(this);
    this.processLogin = this.processLogin.bind(this);
    this.logout = this.logout.bind(this);
  }

  public index(req: Request, res: Response) {
    res.render('app/index', { title: 'Hey', message: 'Hello there!'});
  }

  public login(req: Request, res: Response, error:any) {
    res.render('app/login');
  }

  public processLogin(req: Request, res: Response, next: NextFunction) {
    passport.authenticate('local', (err, user, info) => {
      if (err) {
        return next(err); // will generate a 500 error
      }
      if (!user) {
        return res.render('app/login', {error: 'Usuario o contraseña incorrecta.'});
      }
      req.login(user, loginErr => {
        if (loginErr) {
          return next(loginErr);
        } else {
          user.last_login = Date.now();
          user.save(function (err: any) {
            if (err) {
              console.log(err); // handle errors!
            } else {
              return res.redirect('/');
            }
          });
        }
      });
    })(req, res, next);
  }

  public logout(req: Request, res: Response) {
    req.logout();
    res.redirect('/');
  }

}

export default new AppController();
