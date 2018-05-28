import {Request, Response, NextFunction} from 'express';
import * as passport from 'passport';

class AppController {

  constructor() {
    this.index = this.index.bind(this);
    this.robots = this.robots.bind(this);
    this.login = this.login.bind(this);
    this.processLogin = this.processLogin.bind(this);
    this.logout = this.logout.bind(this);
  }

  public index(req: Request, res: Response) {
    res.render('app/index', { title: 'Hey', message: 'Hello there!'});
  }

  public robots(req: Request, res: Response) {
    res.setHeader('content-type', 'text/plain; charset=utf-8');
    res.send(`User-Agent: *\nDisallow: /`)
  }

  public login(req: Request, res: Response, error:any) {
    if (req.user){
      return res.redirect('/');
    }
    else{
      return res.render('app/login', {local: res.locals});
    }
  }

  public processLogin(req: Request, res: Response, next: NextFunction) {
    if (req.user){
      return res.redirect('/');
    }
    else{
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
  }

  public logout(req: Request, res: Response) {
    req.logout();
    res.redirect('/');
  }

}

export default new AppController();
