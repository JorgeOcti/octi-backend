import {NextFunction, Request, Response} from 'express';
import * as passport from 'passport';
import * as uuid from 'uuid';
import * as isuuid from 'is-uuid';
import redisClient from '../../services/redis.service';
import UserModel from "../models/user.model";
import * as moment from "moment";
import {queue} from "../../app";


class AppController {

  constructor() {
    this.index = this.index.bind(this);
    this.robots = this.robots.bind(this);

    this.login = this.login.bind(this);
    this.processLogin = this.processLogin.bind(this);

    this.forgotPassword = this.forgotPassword.bind(this);
    this.processForgotPassword = this.processForgotPassword.bind(this);

    this.recovery = this.recovery.bind(this);
    this.processRecovery = this.processRecovery.bind(this);

    this.logout = this.logout.bind(this);
  }

  public index(req: Request, res: Response) {
    res.render('app/index');
  }

  public robots(req: Request, res: Response) {
    res.setHeader('content-type', 'text/plain; charset=utf-8');
    res.send(`User-Agent: *\nDisallow: /`)
  }

  public login(req: Request, res: Response, error:any) {
    if (req.user){
      return res.redirect('/');
    } else {
      return res.render('app/login', {csrfToken: req.csrfToken()});
    }
  }

  public processLogin(req: Request, res: Response, next: NextFunction) {
    if (req.user) {
      return res.redirect('/');
    } else {
      passport.authenticate('local', (err, user, info) => {
        if (err) {
          return next(err); // will generate a 500 error
        }
        if (!user) {
          return res.render('app/login', {error: 'Usuario o contraseña incorrecta.', csrfToken: req.csrfToken()});
        }
        req.login(user, loginErr => {
          if (loginErr) {
            return next(loginErr);
          } else {
            user.lastLogin = new Date;
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

  public forgotPassword(req: Request, res: Response, error: any) {
    if (req.user) {
      return res.redirect('/');
    }
    else {
      return res.render('app/forgotPassword', {csrfToken: req.csrfToken()});
    }
  }

  public async processForgotPassword(req: Request, res: Response, error: any) {
    const {username, _csrf} = req.body;
    if (req.user) {
      return res.redirect('/');
    }
    try {
      // prevent duplicate request
      const csrfUsed = await (redisClient as any).getAsync(_csrf);
      if (csrfUsed) {
        return res.redirect('/account/forgot-password/');
      }
      redisClient.setex(_csrf, 60 * 10, 'forgot-password');

      const user = await UserModel.findOne({email: username});
      if (user) {
        const token = uuid.v4();
        const fullname = user.fullName();
        queue.create('email', {
          from: '',
          title: `Recovery password for ${fullname}`,
          to: `"${fullname}"<${user.email}>`,
          subject: `Recuperación de tu cuenta en OSA Andes`,
          text: `Hola ${fullname}

            Recibimos una solicitud para restablecer tu contraseña.
            
            Haz clic aquí para cambiar tu contraseña.
            ${process.env.SITE_URL}account/recovery/${token}/

            ¿No solicitaste este cambio?
            Puedes contactarte con nosotros a través de soporte@osacontrol.com.
            
            © 2018 OSA SpA. Todos los derechos reservados.`,
          view: 'account/forgotPassword',
          context: {
            fullname,
            url: `${process.env.SITE_URL}account/recovery/${token}/`
          }
        }).priority('high').attempts(5).save();
        user.passwordResetToken = token;
        user.passwordResetExpires = moment().add(2, 'days').toDate();
        user.save()
      }
    } catch (e) {
      console.log(e)
    }
    return res.render('app/forgotPassword', {
      csrfToken: req.csrfToken(),
      post: username && username.length
    });
  }

  public async recovery(req: Request, res: Response) {
    const {token} = req.params;
    if(!isuuid.anyNonNil(token)){
      return res.status(404).render('404');
    }
    // close sesión
    req.logout();
    try {
      // validate link is valid
      const user = await UserModel
        .findOne({
          passwordResetToken: token
        });
      return res.render('app/recovery', {
        csrfToken: req.csrfToken(),
        user
      });
    } catch (e) {
      console.log(e)
    }
  }

  public async processRecovery(req: Request, res: Response, next: NextFunction) {
    const {token} = req.params;
    const {password, password2} = req.body;
    if(!isuuid.anyNonNil(token)){
      return res.status(404).render('404');
    }
    if (req.user) {
      return res.redirect( `/`);
    }
    if(!password.trim().length || !password2.trim().length  || password !== password2){
      return res.redirect( `/account/recovery/${token}`);
    }
    try {
      const user = await UserModel.findOne({passwordResetToken: token});
      if (user && user.active) {
        user.password = password;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        user.save();
        req.login(user, loginErr => {
          if (loginErr) {
            return next(loginErr);
          } else {
            user.lastLogin = new Date;
            user.save(function (err: any) {
              if (err) {
                console.log(err); // handle errors!
              } else {
                return res.redirect('/');
              }
            });
          }
        });
      } else {
        return res.redirect(`/account/recovery/${token}`);
      }
    } catch (e) {
      console.log(e)
    }
  }

  public logout(req: Request, res: Response) {
    req.logout();
    res.redirect('/account/login/');
  }
}

export default new AppController();
