import {NextFunction, Request, Response} from 'express';
import * as isuuid from 'is-uuid';
import * as moment from 'moment';
import * as passport from 'passport';
import * as uuid from 'uuid';
import {queue} from '../../app';
import redisClient from '../../services/redis.service';
import UserModel from '../models/user.model';

class AppController {

  constructor() {
    this.index = this.index.bind(this);
    this.healthCheck = this.healthCheck.bind(this);
    this.robots = this.robots.bind(this);

    this.login = this.login.bind(this);
    this.processLogin = this.processLogin.bind(this);

    this.forgotPassword = this.forgotPassword.bind(this);
    this.processForgotPassword = this.processForgotPassword.bind(this);

    this.recovery = this.recovery.bind(this);
    this.processRecovery = this.processRecovery.bind(this);

    this.logout = this.logout.bind(this);
  }

  /* istanbul ignore next */
  public index(req: Request, res: Response) {
    res.render('app/index');
  }

  public healthCheck(req: Request, res: Response) {
    res.json({status: 'success'});
  }

  public robots(req: Request, res: Response) {
    res.setHeader('content-type', 'text/plain; charset=utf-8');
    res.send(`User-Agent: *\nDisallow: /`);
  }

  public login(req: Request, res: Response) {
    if (req.user) {
      return res.redirect('/');
    } else {
      return res.render('app/login', {csrfToken: req.csrfToken()});
    }
  }

  public processLogin(req: Request, res: Response, next: NextFunction) {
    /* istanbul ignore if */
    if (req.user) {
      return res.redirect('/');
    } else {
      const {username} = req.body;
      passport.authenticate('local', (err, user) => {
        /* istanbul ignore if */
        if (err) {
          return next(err); // will generate a 500 error
        }
        /* istanbul ignore if */
        if (!user) {
          return res.render('app/login', {
            username, error: 'Usuario o contraseña incorrecta.', csrfToken: req.csrfToken()
          });
        }
        req.login(user, (loginErr) => {
          /* istanbul ignore if */
          if (loginErr) {
            return next(loginErr);
          } else {
            user.lastLogin = new Date();
            user.save(async (err: any) => {
              /* istanbul ignore if */
              if (err) {
                console.log(err); // handle errors!
              } else {
                try {
                  user = await UserModel.findById(user._id).populate({
                    path: 'userPermissions',
                    select: ['codeName']
                  });
                  return res.redirect(user.hasPermission('viewInventory') ? '/inventory/' : '/');
                } catch (e) {
                  console.log(err); // handle errors!
                }
              }
            });
          }
        });
      })(req, res, next);
    }
  }

  public forgotPassword(req: Request, res: Response) {
    /* istanbul ignore if */
    if (req.user) {
      return res.redirect('/');
    } else {
      return res.render('app/forgotPassword', {csrfToken: req.csrfToken()});
    }
  }

  public async processForgotPassword(req: Request, res: Response) {
    const {username, _csrf} = req.body;
    /* istanbul ignore if */
    if (req.user) {
      return res.redirect('/');
    }
    try {
      // prevent duplicate request
      const csrfUsed = await (redisClient as any).getAsync(_csrf);
      /* istanbul ignore next */
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
        user.save();
      }
    } catch (e) {
      /* istanbul ignore next */
      console.log(e);
    }
    return res.render('app/forgotPassword', {
      csrfToken: req.csrfToken(),
      post: username && username.length
    });
  }

  public async recovery(req: Request, res: Response) {
    const {token} = req.params;
    /* istanbul ignore next */
    if (!isuuid.anyNonNil(token)) {
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
      /* istanbul ignore next */
      console.log(e);
    }
  }

  public async processRecovery(req: Request, res: Response, next: NextFunction) {
    const {token} = req.params;
    const {password, password2} = req.body;
    /* istanbul ignore next */
    if (!isuuid.anyNonNil(token)) {
      return res.status(404).render('404');
    }
    if (req.user) {
      return res.redirect( `/`);
    }
    /* istanbul ignore next */
    if (!password.trim().length || !password2.trim().length || password !== password2) {
      return res.redirect(`/account/recovery/${token}`);
    }
    try {
      const user = await UserModel.findOne({passwordResetToken: token});
      /* istanbul ignore else */
      if (user && user.active) {
        user.password = password;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        user.save();
        req.login(user, (loginErr) => {
          if (loginErr) {
            return next(loginErr);
          } else {
            user.lastLogin = new Date();
            user.save((err: any) => {
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
      /* istanbul ignore next */
      console.log(e);
    }
  }

  public logout(req: Request, res: Response) {
    req.logout();
    res.redirect('/account/login/');
  }
}

export default new AppController();
